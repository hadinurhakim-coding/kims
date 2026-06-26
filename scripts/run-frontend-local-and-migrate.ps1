param(
  [switch]$SkipMigration,
  [switch]$SkipBackend,
  [switch]$SkipFrontend,
  [int]$BackendPort = 8080,
  [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing env file: $Path"
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) {
      return
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      return
    }

    $key = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

function Test-PortAvailable {
  param([int]$Port)

  $listener = Get-NetTCPConnection `
    -LocalPort $Port `
    -State Listen `
    -ErrorAction SilentlyContinue

  if (-not $listener) {
    return
  }

  $processes = $listener | ForEach-Object {
    $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
      "$($process.ProcessName) (PID $($process.Id))"
    } else {
      "PID $($_.OwningProcess)"
    }
  } | Sort-Object -Unique

  throw "Port $Port is already in use by: $($processes -join ', '). Stop that process or pass a different port."
}

function Wait-ForHttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest `
        -Uri $Url `
        -UseBasicParsing `
        -TimeoutSec 2

      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "Timed out waiting for $Url"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $repoRoot "apps\api"
$apiEnvPath = Join-Path $apiDir ".env"

Write-Host "KIMS local runner" -ForegroundColor Green
Write-Host "Repository: $repoRoot"

Require-Command "go"
Require-Command "npm"

if (-not $SkipMigration) {
  Write-Step "Loading API environment"
  Import-DotEnv -Path $apiEnvPath

  if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    throw "DATABASE_URL is missing in apps/api/.env"
  }

  Write-Step "Running database migrations"
  Push-Location $apiDir
  try {
    go run ./cmd/migrate -direction=up
  } finally {
    Pop-Location
  }
}

if (-not $SkipBackend) {
  Test-PortAvailable -Port $BackendPort

  Write-Step "Starting API at http://localhost:$BackendPort"
  $backendCommand = @"
`$ErrorActionPreference = "Stop"
Set-Location "$apiDir"
`$env:PORT = "$BackendPort"
`$env:HTTP_ADDR = ":$BackendPort"
go run ./cmd/api
"@

  Start-Process `
    -FilePath "powershell" `
    -ArgumentList "-NoProfile", "-NoExit", "-Command", $backendCommand `
    -WorkingDirectory $apiDir `
    -WindowStyle Hidden | Out-Null

  Wait-ForHttpOk -Url "http://localhost:$BackendPort/healthz"
}

if (-not $SkipFrontend) {
  Test-PortAvailable -Port $FrontendPort

  Write-Step "Starting frontend at http://localhost:$FrontendPort"
  Push-Location $repoRoot
  try {
    npm run dev --workspace @kims/web -- --port $FrontendPort
  } finally {
    Pop-Location
  }
}

if ($SkipMigration -and $SkipBackend -and $SkipFrontend) {
  Write-Step "Nothing to run because -SkipMigration, -SkipBackend, and -SkipFrontend were provided"
}
