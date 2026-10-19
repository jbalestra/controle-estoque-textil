param (
    [string]$Source = "C:\contole de estoque",
    [string]$Destination = "D:\contole de estoque"
)

# Verifica se o pendrive existe
if (-not (Test-Path $Destination)) {
    Write-Host "[SYNC] Destino nao encontrado: $Destination"
    exit 0
}

$excludeDirs = @('node_modules', '.next', '.git')

function Should-Sync($path) {
    foreach ($dir in $excludeDirs) {
        if ($path -like "*\$dir\*" -or $path -like "*\$dir") {
            return $false
        }
    }
    return $true
}

function Sync-Item($fullPath) {
    if (-not (Should-Sync $fullPath)) { return }
    if (-not (Test-Path $Destination)) { return }

    try {
        $relPath = $fullPath.Substring($Source.Length).TrimStart('\', '/')
        if ([string]::IsNullOrWhiteSpace($relPath)) { return }
        $destPath = Join-Path $Destination $relPath

        if (Test-Path $fullPath -PathType Container) {
            if (-not (Test-Path $destPath)) {
                New-Item -ItemType Directory -Path $destPath -Force | Out-Null
            }
        } elseif (Test-Path $fullPath) {
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Start-Sleep -Milliseconds 200
            Copy-Item -Path $fullPath -Destination $destPath -Force
            Write-Host "[SYNC AUTOMATICO] Salvo no pendrive: $relPath" -ForegroundColor Green
        }
    } catch {
        # Ignora arquivos temporarios
    }
}

function Delete-Item-Dest($fullPath) {
    if (-not (Should-Sync $fullPath)) { return }
    if (-not (Test-Path $Destination)) { return }

    try {
        $relPath = $fullPath.Substring($Source.Length).TrimStart('\', '/')
        if ([string]::IsNullOrWhiteSpace($relPath)) { return }
        $destPath = Join-Path $Destination $relPath

        if (Test-Path $destPath) {
            Remove-Item -Path $destPath -Recurse -Force
            Write-Host "[SYNC AUTOMATICO] Removido do pendrive: $relPath" -ForegroundColor Yellow
        }
    } catch {}
}

$fsw = New-Object IO.FileSystemWatcher $Source -Property @{
    IncludeSubdirectories = $true
    NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite, DirectoryName'
}

Register-ObjectEvent $fsw 'Created' -Action { Sync-Item $Event.SourceEventArgs.FullPath } | Out-Null
Register-ObjectEvent $fsw 'Changed' -Action { Sync-Item $Event.SourceEventArgs.FullPath } | Out-Null
Register-ObjectEvent $fsw 'Renamed' -Action {
    Delete-Item-Dest $Event.SourceEventArgs.OldFullPath
    Sync-Item $Event.SourceEventArgs.FullPath
} | Out-Null
Register-ObjectEvent $fsw 'Deleted' -Action { Delete-Item-Dest $Event.SourceEventArgs.FullPath } | Out-Null

$fsw.EnableRaisingEvents = $true

Write-Host ">>> Sincronizador Ativo em Tempo Real: C: -> D: <<<" -ForegroundColor Cyan
while ($true) {
    Start-Sleep -Seconds 1
}
