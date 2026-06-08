# Credential Setup Guide

Step-by-step credential configuration for the YouTube automation workflows.

## OpenAI (Header Auth)

1. n8n → **Credentials** → **Add credential** → **Header Auth**
2. Name: `OpenAI API Key`
3. Header Name: `Authorization`
4. Header Value: `Bearer sk-your-key-here`
5. Assign to all HTTP Request nodes calling `api.openai.com`

## Google Sheets OAuth2

1. [Google Cloud Console](https://console.cloud.google.com) → Create project
2. Enable **Google Sheets API**
3. OAuth consent screen → External → Add scope: `spreadsheets`
4. Credentials → OAuth 2.0 Client ID → Web application
5. Redirect URI: your n8n OAuth callback URL (shown in n8n credential form)
6. In n8n: **Google Sheets OAuth2 API** → paste Client ID + Secret → Connect

## YouTube OAuth2

1. Same Google Cloud project → Enable **YouTube Data API v3**
2. OAuth consent screen → Add scope: `https://www.googleapis.com/auth/youtube.upload`
3. Use same OAuth client or create dedicated one
4. In n8n: **YouTube OAuth2 API** → Connect with channel owner account

## ElevenLabs

Set environment variables (no n8n credential needed):

```
ELEVENLABS_API_KEY=your-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL=eleven_multilingual_v2
```

Browse voices: https://elevenlabs.io/voice-library

## Creatomate

1. Sign up at https://creatomate.com
2. Create templates from files in `templates/`
3. Settings → API Keys → copy key
4. Set env vars:

```
CREATOMATE_API_KEY=...
CREATOMATE_SHORT_TEMPLATE_ID=...
CREATOMATE_LONG_TEMPLATE_ID=...
```

## Runway (Optional)

```
RUNWAY_API_KEY=...
RUNWAY_ENABLED=true
```

When disabled, scene visuals use DALL-E still images (Ken Burns effect in Creatomate).

## Link Error Handler Workflow

After importing workflows:

1. Open **03 Error Handler & Logging** → copy workflow ID from URL
2. Set n8n variable: `WORKFLOW_ERROR_HANDLER_ID=<id>`
3. In workflows 01 and 02 → Settings → **Error Workflow** → select error handler

## Self-Hosted n8n .env Example

```env
N8N_ENCRYPTION_KEY=your-32-char-key
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=localhost
WEBHOOK_URL=https://your-n8n-domain.com/

# All vars from config/env.example
GOOGLE_SHEETS_DOCUMENT_ID=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
CREATOMATE_API_KEY=
WORKFLOW_ERROR_HANDLER_ID=
```

Queue mode is recommended for 20 videos/day to avoid memory exhaustion during Creatomate polling.
