using System.Buffers.Binary;
using System.IO.Compression;
using AnimeWeb.Api.Shared.Errors;

namespace AnimeWeb.Api.Features.Auth;

// Only small, non-interlaced 8-bit RGB/RGBA PNGs produced by the FE canvas are accepted.
// Validate chunks/CRC, dimensions and bounded decompression without a native image dependency.
public static class AvatarPng
{
    public static void Validate(byte[] content)
    {
        if (content.Length == 0) throw ApiFailure.Invalid("file");
        if (content.Length > AvatarService.MaxBytes) throw new ApiFailure(413, "AVATAR_TOO_LARGE", "Avatar exceeds 2 MiB.");
        try { ValidatePng(content); }
        catch (Exception error) when (error is InvalidDataException or EndOfStreamException or OverflowException or ArgumentException)
        { throw ApiFailure.Invalid("file", "Use a valid RGB/RGBA PNG of at most 512 by 512 pixels."); }
    }
    private static void ValidatePng(byte[] content)
    {
        if (content.Length < 45 || !content.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) throw new InvalidDataException();
        var width = 0;
        var height = 0;
        var channels = 0;
        var ended = false;
        using var compressed = new MemoryStream();
        for (var offset = 8; offset < content.Length;)
        {
            if (content.Length - offset < 12) throw new InvalidDataException();
            var length = checked((int)BinaryPrimitives.ReadUInt32BigEndian(content.AsSpan(offset, 4)));
            if (length > content.Length - offset - 12) throw new InvalidDataException();
            var typeAndData = content.AsSpan(offset + 4, length + 4);
            uint crc = uint.MaxValue;
            foreach (var value in typeAndData)
            {
                crc ^= value;
                for (var bit = 0; bit < 8; bit++) crc = (crc >> 1) ^ ((crc & 1) == 0 ? 0u : 0xedb88320u);
            }
            if (~crc != BinaryPrimitives.ReadUInt32BigEndian(content.AsSpan(offset + length + 8, 4))) throw new InvalidDataException();
            var type = System.Text.Encoding.ASCII.GetString(typeAndData[..4]);
            var data = content.AsSpan(offset + 8, length);
            if (offset == 8 && type != "IHDR") throw new InvalidDataException();
            if (type == "IHDR")
            {
                if (offset != 8 || length != 13) throw new InvalidDataException();
                width = checked((int)BinaryPrimitives.ReadUInt32BigEndian(data[..4]));
                height = checked((int)BinaryPrimitives.ReadUInt32BigEndian(data.Slice(4, 4)));
                if (width is < 1 or > 512 || height is < 1 or > 512 || data[8] != 8 || data[9] is not (2 or 6)
                    || data[10] != 0 || data[11] != 0 || data[12] != 0) throw new InvalidDataException();
                channels = data[9] == 6 ? 4 : 3;
            }
            else if (type == "IDAT") compressed.Write(data);
            else if (type == "IEND")
            {
                if (length != 0 || offset + 12 != content.Length) throw new InvalidDataException();
                ended = true;
            }
            else if (type is not ("sRGB" or "gAMA" or "cHRM" or "pHYs")) throw new InvalidDataException();
            offset += length + 12;
        }
        if (!ended || compressed.Length == 0) throw new InvalidDataException();
        compressed.Position = 0;
        using var pixels = new ZLibStream(compressed, CompressionMode.Decompress);
        var row = new byte[width * channels];
        for (var y = 0; y < height; y++)
        {
            if (pixels.ReadByte() is < 0 or > 4) throw new InvalidDataException();
            pixels.ReadExactly(row);
        }
        if (pixels.ReadByte() != -1) throw new InvalidDataException();
    }
}
