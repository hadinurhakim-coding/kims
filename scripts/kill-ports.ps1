param(
  [int[]]$Ports = @(3000, 8080, 8081)
)

foreach ($port in $Ports) {
  $processes = Get-NetTCPConnection `
    -LocalPort $port `
    -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess `
    -Unique

  if ($processes) {
    foreach ($processId in $processes) {
      $procInfo = Get-Process -Id $processId `
        -ErrorAction SilentlyContinue

      if ($procInfo) {
        Write-Host "Killing PID $processId ($($procInfo.ProcessName)) on port $port"
        Stop-Process -Id $processId -Force
      }
    }
  } else {
    Write-Host "No process found on port $port"
  }
}

Write-Host "Done. Ports checked: $($Ports -join ', ')"
