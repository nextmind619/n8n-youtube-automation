# Google Sheets Schema

Create one spreadsheet with four tabs. Row 1 = headers (bold, freeze row 1).

## Tab: `Queue`

Tracks daily production queue (orchestrator writes, pipeline updates).

| Column | Type | Description |
|--------|------|-------------|
| queue_id | string | UUID, primary key |
| status | enum | `pending` \| `processing` \| `completed` \| `failed` \| `retry` |
| topic | string | AI automation tutorial topic (e.g. Make.com, n8n, Zapier) |
| source | string | reddit_n8n \| news \| seed \| ai_generated |
| priority | number | 1–10, higher = first |
| retry_count | number | 0–3 |
| scheduled_at | datetime | When to process |
| started_at | datetime | Pipeline start |
| completed_at | datetime | Pipeline end |
| error_message | string | Last error if failed |

## Tab: `Content`

All generated assets per video (one row per video).

| Column | Type | Description |
|--------|------|-------------|
| video_id | string | UUID |
| queue_id | string | FK to Queue |
| status | string | completed \| failed |
| topic | string | Original topic |
| viral_title | string | Hook title |
| short_script | text | 60s Short script |
| long_script | text | ~10 min script |
| scenes_json | text | JSON array of scene prompts |
| scene_assets_json | text | URLs from AI video/image gen |
| voiceover_short_url | url | ElevenLabs MP3 (Short) |
| voiceover_long_url | url | ElevenLabs MP3 (long) |
| captions_srt | text | SRT caption file content |
| thumbnail_prompt | text | DALL-E prompt |
| thumbnail_url | url | Generated thumbnail |
| seo_title | string | YouTube SEO title |
| seo_description | text | Description with timestamps |
| seo_tags | string | Comma-separated tags |
| creatomate_short_render_id | string | Creatomate job ID |
| creatomate_long_render_id | string | Creatomate job ID |
| final_short_url | url | Rendered Short MP4 |
| final_long_url | url | Rendered long MP4 |
| youtube_short_id | string | YouTube video ID |
| youtube_long_id | string | YouTube video ID |
| youtube_short_url | url | Public Short URL |
| youtube_long_url | url | Public long URL |
| created_at | datetime | ISO 8601 |
| updated_at | datetime | ISO 8601 |

## Tab: `Errors`

| Column | Type | Description |
|--------|------|-------------|
| error_id | string | UUID |
| timestamp | datetime | When error occurred |
| workflow | string | orchestrator \| production \| upload |
| node_name | string | Failing n8n node |
| queue_id | string | Related queue item |
| video_id | string | Related video |
| error_message | text | Full error |
| stack_trace | text | Optional |
| retry_count | number | Attempt number |

## Tab: `Logs`

| Column | Type | Description |
|--------|------|-------------|
| log_id | string | UUID |
| timestamp | datetime | Event time |
| level | enum | info \| warn \| error |
| workflow | string | Workflow name |
| message | text | Log message |
| metadata_json | text | Extra context |

## Sample header row (Queue)

```
queue_id | status | topic | source | priority | retry_count | scheduled_at | started_at | completed_at | error_message
```

Import `queue-template.csv` from this folder for a ready-made header row.
