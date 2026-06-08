#Requires -Version 5.1
<#
.SYNOPSIS
  إعداد كامل لنظام YouTube Automation
.USAGE
  1. املأ config\secrets.env (على الأقل N8N_API_KEY)
  2. .\scripts\setup-all.ps1
#>

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$SecretsFile = Join-Path $Root "config\secrets.env"
$ConfigFile  = Join-Path $Root "config\user-config.json"
$WorkflowsDir = Join-Path $Root "workflows"

function Load-DotEnv($path) {
    $vars = @{}
    if (-not (Test-Path $path)) { return $vars }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -eq '') { return }
        if ($line -match '^([^=]+)=(.*)$') {
            $vars[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
    return $vars
}

function Write-Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }

$secrets = Load-DotEnv $SecretsFile
$config  = Get-Content $ConfigFile | ConvertFrom-Json

$N8nUrl  = if ($secrets.N8N_BASE_URL) { $secrets.N8N_BASE_URL.TrimEnd('/') } else { $config.n8n_base_url }
$SheetId = if ($secrets.GOOGLE_SHEETS_DOCUMENT_ID) { $secrets.GOOGLE_SHEETS_DOCUMENT_ID } else { $config.google_sheets_document_id }

Write-Host "========================================" -ForegroundColor Green
Write-Host " YouTube Automation - Full Setup" -ForegroundColor Green
Write-Host " n8n: $N8nUrl" -ForegroundColor Green
Write-Host " Sheet: $SheetId" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# ── 1. Google Sheets Apps Script ───────────────────────────────
Write-Step 1 "Google Sheets — تشغيل Apps Script"
Write-Host "  افتح جدولك:" -ForegroundColor Yellow
Write-Host "  $($config.google_sheets_url)" -ForegroundColor White
Write-Host "  Extensions → Apps Script → الصق محتوى:" -ForegroundColor Yellow
Write-Host "  $Root\scripts\setup-google-sheets.gs" -ForegroundColor White
Write-Host "  Run → setupAllSheets" -ForegroundColor Yellow

$openSheet = Read-Host "  هل شغّلت Apps Script؟ (y/n)"
if ($openSheet -ne 'y') {
    Write-Host "  افتح الرابط وشغّل السكربت ثم أعد تشغيل setup-all.ps1" -ForegroundColor Red
    Start-Process $config.google_sheets_url
    exit 1
}

# ── 2. n8n API Key check ───────────────────────────────────────
Write-Step 2 "n8n — استيراد Workflows"
$ApiKey = $secrets.N8N_API_KEY
if (-not $ApiKey) {
    Write-Host "  N8N_API_KEY فارغ في config\secrets.env" -ForegroundColor Red
    Write-Host "  أنشئ مفتاحاً من: $N8nUrl/settings/api" -ForegroundColor Yellow
    Start-Process "$N8nUrl/settings/api"
    exit 1
}

$headers = @{
    "X-N8N-API-KEY" = $ApiKey
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
}

# Test API
try {
    $null = Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows?limit=1" -Headers $headers -Method GET
    Write-Host "  n8n API: OK" -ForegroundColor Green
} catch {
    Write-Host "  فشل الاتصال بـ n8n API: $_" -ForegroundColor Red
    exit 1
}

# Build env replacements for workflow JSON
$replacements = @{
    '{{GOOGLE_SHEETS_DOCUMENT_ID}}' = $SheetId
    '={{ $env.GOOGLE_SHEETS_DOCUMENT_ID }}' = "=$SheetId"
}
foreach ($k in $secrets.Keys) {
    if ($secrets[$k]) {
        $replacements["={{ `$env.$k }}"] = "=$($secrets[$k])"
        $replacements["{{ `$env.$k }}"] = $secrets[$k]
    }
}

function Import-Workflow($filename) {
    $path = Join-Path $WorkflowsDir $filename
    $raw  = Get-Content $path -Raw -Encoding UTF8

    # Inject spreadsheet ID directly
    $raw = $raw -replace '\=\{\{ `$env\.GOOGLE_SHEETS_DOCUMENT_ID \}\}', "=$SheetId"
    $raw = $raw -replace '\{\{ `$env\.GOOGLE_SHEETS_DOCUMENT_ID \}\}', $SheetId

    $wf = $raw | ConvertFrom-Json
    $wf.active = $false

    # Remove pinData/meta issues for API
    if (-not $wf.settings) { $wf | Add-Member -NotePropertyName settings -NotePropertyValue @{} }
    $wf.settings.executionOrder = "v1"

    $json = $wf | ConvertTo-Json -Depth 100 -Compress
    $resp = Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows" -Method POST -Headers $headers -Body $json
    return $resp
}

$order = @(
    "03-error-handler-logging.json",
    "01-daily-topic-discovery.json",
    "02-video-production-pipeline.json"
)

$imported = @{}
foreach ($file in $order) {
    Write-Host "  Importing $file ..." -ForegroundColor Gray
    try {
        $resp = Import-Workflow $file
        $imported[$file] = $resp.id
        Write-Host "  -> ID: $($resp.id) | $($resp.name)" -ForegroundColor Green
    } catch {
        Write-Host "  FAILED $file : $_" -ForegroundColor Red
        # Try to find existing
        $existing = Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows?limit=100" -Headers $headers
        $match = $existing.data | Where-Object { $_.name -like "*$(($file -replace '\.json','') -replace '^\d+-','')*" }
        if ($match) {
            $imported[$file] = $match[0].id
            Write-Host "  -> Using existing ID: $($match[0].id)" -ForegroundColor Yellow
        }
    }
}

$errorHandlerId = $imported["03-error-handler-logging.json"]
if ($errorHandlerId) {
    Write-Step 3 "ربط Error Handler: $errorHandlerId"
    foreach ($f in @("01-daily-topic-discovery.json", "02-video-production-pipeline.json")) {
        if (-not $imported[$f]) { continue }
        $id = $imported[$f]
        try {
            $wf = Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows/$id" -Headers $headers
            if (-not $wf.settings) { $wf.settings = @{} }
            $wf.settings.errorWorkflow = $errorHandlerId
            $body = $wf | ConvertTo-Json -Depth 100
            Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows/$id" -Method PUT -Headers $headers -Body $body | Out-Null
            Write-Host "  Linked error handler to workflow $id" -ForegroundColor Green
        } catch {
            Write-Host "  Manual: set Error Workflow on workflow $id -> $errorHandlerId" -ForegroundColor Yellow
        }
    }
}

# ── 3. Credentials guide ───────────────────────────────────────
Write-Step 4 "Credentials — يتطلب نقرة واحدة في المتصفح"
$credUrl = "$N8nUrl/home/credentials"
Write-Host "  افتح: $credUrl" -ForegroundColor Yellow

if ($secrets.OPENAI_API_KEY) {
    Write-Host @"

  OpenAI Header Auth:
    Name: OpenAI API Key
    Header: Authorization
    Value: Bearer $($secrets.OPENAI_API_KEY.Substring(0,[Math]::Min(8,$secrets.OPENAI_API_KEY.Length)))...

"@ -ForegroundColor Gray
}

Write-Host @"
  Google Sheets OAuth2: $credUrl
    Client ID/Secret من: https://console.cloud.google.com/apis/credentials

  YouTube OAuth2: $credUrl
    نفس Google Cloud project

  ElevenLabs + Creatomate: via secrets.env (HTTP nodes)
"@ -ForegroundColor Gray

# ── 4. n8n Variables (manual on Cloud) ─────────────────────────
Write-Step 5 "n8n Variables"
$varsUrl = "$N8nUrl/variables"
Write-Host "  افتح: $varsUrl" -ForegroundColor Yellow
Write-Host "  أضف المتغيرات من config\secrets.env" -ForegroundColor Yellow
if ($errorHandlerId) {
    Write-Host "  WORKFLOW_ERROR_HANDLER_ID = $errorHandlerId" -ForegroundColor White
}

# ── 5. Open setup URLs ───────────────────────────────────────────
Write-Step 6 "فتح روابط الإعداد المتبقية"
$urls = @(
    $config.google_sheets_url,
    "https://console.cloud.google.com/projectcreate",
    "https://console.cloud.google.com/apis/library/sheets.googleapis.com",
    "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    "https://console.cloud.google.com/apis/credentials/consent",
    "https://console.cloud.google.com/apis/credentials",
    "https://platform.openai.com/api-keys",
    "https://elevenlabs.io/app/settings/api-keys",
    "https://app.creatomate.com/signup",
    "$N8nUrl/home/workflows"
)
foreach ($u in $urls) { Start-Process $u; Start-Sleep -Milliseconds 800 }

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " DONE — الملخص:" -ForegroundColor Green
Write-Host "  Error Handler ID: $errorHandlerId" -ForegroundColor White
Write-Host "  Workflows: $N8nUrl/home/workflows" -ForegroundColor White
Write-Host "  Sheet: $($config.google_sheets_url)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nباقي خطوتين يدويتين فقط:" -ForegroundColor Yellow
Write-Host "  1. OAuth Google Sheets + YouTube في n8n Credentials" -ForegroundColor Yellow
Write-Host "  2. املأ API keys في secrets.env + Variables في n8n" -ForegroundColor Yellow
