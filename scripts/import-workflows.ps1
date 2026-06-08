# Import n8n workflows via REST API (self-hosted n8n)
# Usage: .\import-workflows.ps1 -N8nUrl "http://localhost:5678" -ApiKey "your-api-key"

param(
    [Parameter(Mandatory=$true)][string]$N8nUrl,
    [Parameter(Mandatory=$true)][string]$ApiKey
)

$headers = @{
    "X-N8N-API-KEY" = $ApiKey
    "Content-Type"  = "application/json"
}

$base = Join-Path $PSScriptRoot "..\workflows"
$order = @(
    "03-error-handler-logging.json",
    "01-daily-topic-discovery.json",
    "02-video-production-pipeline.json"
)

foreach ($file in $order) {
    $path = Join-Path $base $file
    $body = Get-Content $path -Raw | ConvertFrom-Json
    $body.active = $false
    $json = $body | ConvertTo-Json -Depth 100

    Write-Host "Importing $file ..."
    $resp = Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows" -Method POST -Headers $headers -Body $json
    Write-Host "  -> ID: $($resp.id) Name: $($resp.name)"
}

Write-Host "`nDone. Set WORKFLOW_ERROR_HANDLER_ID to the error handler workflow ID."
