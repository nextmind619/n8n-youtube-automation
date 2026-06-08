#Requires -Version 5.1
param(
    [string]$WorkflowId = "G9fZzsrIjzJpPkwS"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$SecretsFile = Join-Path $Root "config\secrets.env"

function Load-DotEnv($path) {
    $vars = @{}
    if (-not (Test-Path $path)) { return $vars }
    Get-Content $path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -eq '') { return }
        if ($line -match '^([^=]+)=(.*)$') {
            $vars[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
    return $vars
}

$secrets = Load-DotEnv $SecretsFile
$N8nUrl = ($secrets.N8N_BASE_URL).TrimEnd('/')
if (-not $N8nUrl) { $N8nUrl = "https://darkvault.app.n8n.cloud" }
$ApiKey = $secrets.N8N_API_KEY

if (-not $ApiKey) {
    Write-Host "ERROR: N8N_API_KEY is empty in config\secrets.env"
    Write-Host "Open: $N8nUrl/settings/api"
    Write-Host "Create API Key, paste into secrets.env, run again."
    Start-Process "$N8nUrl/settings/api"
    exit 1
}

$headers = @{
    "X-N8N-API-KEY" = $ApiKey
    "Accept"        = "application/json"
    "Content-Type"  = "application/json"
}

Write-Host "GET workflow $WorkflowId ..."
$remote = Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows/$WorkflowId" -Headers $headers -Method GET
$raw = $remote | ConvertTo-Json -Depth 100 -Compress

$replacements = [ordered]@{
    '$env.' = '$vars.'
    'mystery unsolved stories paranormal cold cases' = 'AI workflow automation for small business - Make.com n8n Zapier no-code tutorials'
    'mystery unsolved stories' = 'AI workflow automation for small business - Make.com n8n Zapier tutorials'
    'UnresolvedMysteries' = 'n8n'
    'unsolved+mystery+cold+case' = 'make.com+n8n+zapier+AI+automation+workflow'
    'You are a YouTube trend researcher for mystery/unsolved story channels' = 'You are a YouTube trend researcher for English faceless channels in AI workflow automation (Make.com, n8n, Zapier, no-code)'
    'unique trending mystery topics' = 'unique tutorial topics for automation/AI business'
    'overly sensitive real-victim content' = 'duplicate or off-topic stories'
    'You write viral YouTube titles for mystery channels' = 'You write high-CTR searchable YouTube titles for English AI automation tutorial channels (Make.com, n8n, Zapier, no-code)'
    'Use curiosity gap framing' = 'Prefer titles like How to..., Best..., X vs Y, Automate... with Make/n8n. Clear value'
    'Cinematic mystery mood, no text in images' = 'Visual style: modern tech explainer, abstract dashboards, workflow nodes, clean blue/purple lighting, professional, no readable text, no logos'
    'dark mystery atmosphere' = 'modern SaaS tech explainer, clean professional lighting, abstract UI'
    'Mystery channel style, dramatic lighting, single focal subject' = 'Style: tech tutorial, automation/workflow theme, bright contrast, faceless, not horror'
    'Hook, background, evidence, theories, conclusion' = 'Structure: hook (pain point), what you will learn, step-by-step (Make/n8n/Zapier), recap, CTA check description for tools. No fictional stories'
    'Write 60-second YouTube Shorts scripts' = 'Write 60-second YouTube Shorts tutorial scripts'
    'Write 10-minute narration' = 'Write 8-10 minute faceless tutorial narration'
}

$patched = $raw
$changeCount = 0
foreach ($kv in $replacements.GetEnumerator()) {
    if ($patched.Contains($kv.Key)) {
        $patched = $patched.Replace($kv.Key, $kv.Value)
        $changeCount++
    }
}

Write-Host "Applied $changeCount patch groups."

$bodyObj = $patched | ConvertFrom-Json
$putBody = @{
    name        = $bodyObj.name
    nodes       = $bodyObj.nodes
    connections = $bodyObj.connections
    settings    = $bodyObj.settings
    staticData  = $bodyObj.staticData
}
$putJson = $putBody | ConvertTo-Json -Depth 100

Write-Host "PUT workflow $WorkflowId ..."
Invoke-RestMethod -Uri "$N8nUrl/api/v1/workflows/$WorkflowId" -Headers $headers -Method PUT -Body $putJson | Out-Null

Write-Host "SUCCESS: $N8nUrl/workflow/$WorkflowId"
