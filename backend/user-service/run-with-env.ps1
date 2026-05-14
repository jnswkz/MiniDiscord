Get-Content "$PSScriptRoot\..\.env" | Where-Object { $_ -match '^[A-Z][A-Z0-9_]*=' } | ForEach-Object {
    $kv = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($kv[0], $kv[1], 'Process')
}
Set-Location $PSScriptRoot
mvn -q spring-boot:run
