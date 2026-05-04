Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName Microsoft.VisualBasic

$root = "D:\5th sem\thirfy_shoes_e"
$codeExe = (Get-Command code).Source

function Save-ScreenShot {
    param(
        [string]$Path
    )

    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

function Focus-VSCode {
    Start-Sleep -Seconds 2
    [Microsoft.VisualBasic.Interaction]::AppActivate("Visual Studio Code") | Out-Null
    Start-Sleep -Milliseconds 1200
}

$wshell = New-Object -ComObject WScript.Shell

Start-Process -FilePath $codeExe -ArgumentList @("-n", "$root\lab7_code_view.py")
Start-Sleep -Seconds 6
Focus-VSCode
Save-ScreenShot "$root\vscode_code_top.png"
$wshell.SendKeys("{PGDN}")
Start-Sleep -Seconds 2
Save-ScreenShot "$root\vscode_code_bottom.png"

Start-Process -FilePath $codeExe -ArgumentList @("-r", "$root\lab7_output_view.txt")
Start-Sleep -Seconds 4
Focus-VSCode
Save-ScreenShot "$root\vscode_output_top.png"
$wshell.SendKeys("{PGDN}")
Start-Sleep -Seconds 2
Save-ScreenShot "$root\vscode_output_bottom.png"

Write-Output "Captured VS Code screenshots."
