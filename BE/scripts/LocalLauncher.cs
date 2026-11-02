using System.Diagnostics;

if (!OperatingSystem.IsWindows())
{
    Console.Error.WriteLine("The local launcher requires Windows and Docker Desktop. Run the API project directly on other platforms.");
    return 1;
}

var backendDirectory = new DirectoryInfo(AppContext.BaseDirectory);
while (backendDirectory is not null && !File.Exists(Path.Combine(backendDirectory.FullName, "scripts", "start-local.ps1")))
{
    backendDirectory = backendDirectory.Parent;
}

if (backendDirectory is null)
{
    Console.Error.WriteLine("Cannot find BE/scripts/start-local.ps1. Run dotnet run from the BE directory.");
    return 1;
}

var startInfo = new ProcessStartInfo("powershell.exe")
{
    WorkingDirectory = backendDirectory.FullName,
    UseShellExecute = false,
};
startInfo.ArgumentList.Add("-NoProfile");
startInfo.ArgumentList.Add("-ExecutionPolicy");
startInfo.ArgumentList.Add("Bypass");
startInfo.ArgumentList.Add("-File");
startInfo.ArgumentList.Add(Path.Combine(backendDirectory.FullName, "scripts", "start-local.ps1"));
foreach (var argument in args)
{
    startInfo.ArgumentList.Add(argument);
}

using var process = Process.Start(startInfo);
if (process is null)
{
    Console.Error.WriteLine("Could not start the local backend.");
    return 1;
}

// Child processes share the console and receive Ctrl+C too. Keep this parent
// alive until PowerShell finishes so dotnet run does not leave the API behind.
Console.CancelKeyPress += (_, eventArgs) => eventArgs.Cancel = true;
await process.WaitForExitAsync();
return process.ExitCode;
