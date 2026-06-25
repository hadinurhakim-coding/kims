param(
  [switch]$SkipMigration,
  [switch]$SkipFrontend
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

if (-not $SkipFrontend) {
  Write-Step "Starting frontend at http://localhost:3000"
  Push-Location $repoRoot
  try {
    npm run web:dev
  } finally {
    Pop-Location
  }
}

if ($SkipMigration -and $SkipFrontend) {
  Write-Step "Nothing to run because both -SkipMigration and -SkipFrontend were provided"
}
