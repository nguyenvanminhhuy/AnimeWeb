export const avatarSourceLimit = 5 * 1024 * 1024;

/** Produce one small, metadata-free PNG. The server validates the actual image independently. */
export async function prepareAvatar(file: File, signal: AbortSignal): Promise<Blob> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Chọn ảnh PNG, JPG hoặc WebP.');
  if (!file.size || file.size > avatarSourceLimit)
    throw new Error('Ảnh phải có dung lượng từ 1 byte đến 5 MB.');
  signal.throwIfAborted();
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error('Không đọc được ảnh. Hãy chọn một ảnh khác.');
  }
  try {
    signal.throwIfAborted();
    if (image.width > 8192 || image.height > 8192)
      throw new Error('Kích thước ảnh tối đa là 8192 × 8192px.');
    const canvas = document.createElement('canvas');
    const size = Math.min(512, image.width, image.height);
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không xử lý được ảnh.');
    const sourceSize = Math.min(image.width, image.height);
    context.drawImage(
      image,
      (image.width - sourceSize) / 2,
      (image.height - sourceSize) / 2,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size,
    );
    const result = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Không xử lý được ảnh.'))),
        'image/png',
      ),
    );
    signal.throwIfAborted();
    if (result.size > 2 * 1024 * 1024) throw new Error('Ảnh sau xử lý vượt quá 2 MB.');
    return result;
  } finally {
    image.close();
  }
}
