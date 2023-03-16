$cwd = Get-Location


Set-Location (Join-Path $cwd src)

function runDetype {
    Get-ChildItem -recurse -include '*.ts' | Foreach-Object {
        $outFile = (Join-Path $_.Directory.FullName "$($_.BaseName + '.js')") ;
        Write-Host "De-typing $($_.BaseName) ---> $outFile";
        npx detype $_.FullName  $outFile ;
      }

}

runDetype


Write-Host "Collecting files into $dist"
$dist = (Join-Path $cwd dist)
 if (!(Test-Path -Path $dist)) {
     Write-Host "Creating $dist"
     New-Item -ItemType Directory -Force -Path $dist
 }
 Get-ChildItem -Recurse -Include '*.js' | Move-Item -Destination $dist -Force

# Restore original working directory
Set-Location $cwd
