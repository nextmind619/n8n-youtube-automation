#!/usr/bin/env python3
"""Generate n8n workflow JSON for YouTube automation."""

import json
import uuid

def uid(n):
    return f"b2c3d4e5-{n:04x}-4000-8000-000000000000"

def node(name, ntype, pos, params, **extra):
    base = {
        "parameters": params,
        "id": uid(extra.get("id_num", hash(name) % 9999)),
        "name": name,
        "type": ntype,
        "typeVersion": extra.get("typeVersion", 1),
        "position": pos,
    }
    for k in ("retryOnFail", "maxTries", "waitBetweenTries", "onError", "credentials"):
        if k in extra:
            base[k] = extra[k]
    return base

def conn(src, targets):
    return {src: {"main": [[{"node": t, "type": "main", "index": 0} for t in (targets if isinstance(targets, list) else [targets])]]}}

OPENAI_CRED = {"httpHeaderAuth": {"id": "OPENAI_HEADER_AUTH", "name": "OpenAI API Key"}}
SHEETS_CRED = {"googleSheetsOAuth2Api": {"id": "GOOGLE_SHEETS_OAUTH", "name": "Google Sheets OAuth"}}
YOUTUBE_CRED = {"youTubeOAuth2Api": {"id": "YOUTUBE_OAUTH", "name": "YouTube OAuth2"}}

RETRY = {"retryOnFail": True, "maxTries": 3, "waitBetweenTries": 8000}

nodes = []
connections = {}

# ── Triggers & config ──────────────────────────────────────────────────────
nodes += [
    node("Hourly Queue Processor", "n8n-nodes-base.scheduleTrigger", [0, 400],
         {"rule": {"interval": [{"field": "cronExpression", "expression": "0 */1 * * *"}]}},
         typeVersion=1.2, id_num=1),
    node("Manual Trigger", "n8n-nodes-base.manualTrigger", [0, 200], {}, id_num=2),
    node("Load Config", "n8n-nodes-base.set", [220, 300],
         {"assignments": {"assignments": [
             {"id": "c1", "name": "sheetId", "value": "={{ $vars.GOOGLE_SHEETS_DOCUMENT_ID }}", "type": "string"},
             {"id": "c2", "name": "queueTab", "value": "={{ $vars.GOOGLE_SHEETS_QUEUE_TAB || 'Queue' }}", "type": "string"},
             {"id": "c3", "name": "contentTab", "value": "={{ $vars.GOOGLE_SHEETS_CONTENT_TAB || 'Content' }}", "type": "string"},
             {"id": "c4", "name": "openaiModel", "value": "={{ $vars.OPENAI_MODEL || 'gpt-4o' }}", "type": "string"},
             {"id": "c5", "name": "voiceId", "value": "={{ $vars.ELEVENLABS_VOICE_ID }}", "type": "string"},
             {"id": "c6", "name": "niche", "value": "={{ $vars.CHANNEL_NICHE || 'AI Workflow & Automation for Business - Make.com n8n Zapier no-code tutorials' }}", "type": "string"},
             {"id": "c7", "name": "creatomateShortTpl", "value": "={{ $vars.CREATOMATE_SHORT_TEMPLATE_ID }}", "type": "string"},
             {"id": "c8", "name": "creatomateLongTpl", "value": "={{ $vars.CREATOMATE_LONG_TEMPLATE_ID }}", "type": "string"},
         ]}, "options": {}}, typeVersion=3.4, id_num=3),
]

connections.update(conn("Hourly Queue Processor", "Load Config"))
connections.update(conn("Manual Trigger", "Load Config"))

# ── Queue fetch ──────────────────────────────────────────────────────────────
nodes.append(node("Get Next Pending Item", "n8n-nodes-base.googleSheets", [440, 300],
    {"operation": "read",
     "documentId": {"__rl": True, "value": "={{ $json.sheetId }}", "mode": "id"},
     "sheetName": {"__rl": True, "value": "={{ $json.queueTab }}", "mode": "name"},
     "filtersUI": {"values": [{"lookupColumn": "status", "lookupValue": "pending"}]},
     "options": {"returnFirstMatch": True}},
    typeVersion=4.5, credentials=SHEETS_CRED, id_num=4))

connections.update(conn("Load Config", "Get Next Pending Item"))

nodes.append(node("Has Processable Item?", "n8n-nodes-base.if", [660, 300],
    {"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
     "conditions": [
         {"id": "has-topic", "leftValue": "={{ $json.topic }}", "rightValue": "", "operator": {"type": "string", "operation": "notEmpty"}},
         {"id": "due", "leftValue": "={{ !$json.scheduled_at || DateTime.fromISO($json.scheduled_at) <= $now }}", "rightValue": True, "operator": {"type": "boolean", "operation": "equals"}},
     ], "combinator": "and"}, "options": {}},
    typeVersion=2.2, id_num=5))

connections.update(conn("Get Next Pending Item", "Has Processable Item?"))

INIT_CODE = r"""const item = $input.first().json;
const config = $('Load Config').first().json;
const { randomUUID } = require('crypto');
const titleResp = $('Generate Viral Title').first()?.json;
let viral_title = '', hook_text = '';
if (titleResp?.choices) {
  const t = JSON.parse(titleResp.choices[0].message.content);
  viral_title = t.viral_title; hook_text = t.hook_text;
}
return [{ json: { ...config, ...item, video_id: randomUUID(), viral_title, hook_text, status: 'processing', started_at: new Date().toISOString() } }];"""

nodes.append(node("Init Video Job", "n8n-nodes-base.code", [880, 200],
    {"mode": "runOnceForAllItems",
     "jsCode": r"""const item = $input.first().json;
const config = $('Load Config').first().json;
const { randomUUID } = require('crypto');
return [{ json: { ...config, ...item, video_id: randomUUID(), status: 'processing', started_at: new Date().toISOString() } }];"""},
    typeVersion=2, id_num=6))

connections["Has Processable Item?"] = {"main": [
    [{"node": "Init Video Job", "type": "main", "index": 0}],
    []
]}

nodes.append(node("Mark Queue Processing", "n8n-nodes-base.googleSheets", [1100, 200],
    {"operation": "update",
     "documentId": {"__rl": True, "value": "={{ $json.sheetId }}", "mode": "id"},
     "sheetName": {"__rl": True, "value": "={{ $json.queueTab }}", "mode": "name"},
     "columns": {"mappingMode": "defineBelow", "value": {"status": "processing", "started_at": "={{ $json.started_at }}"},
                 "matchingColumns": ["queue_id"]}, "options": {}},
    typeVersion=4.5, credentials=SHEETS_CRED, id_num=7))

connections.update(conn("Init Video Job", "Mark Queue Processing"))

def openai_node(name, pos, system, user_expr, id_num):
    body = f"""={{
  "model": "{{{{ $('Init Video Job').first().json.openaiModel }}}}",
  "temperature": 0.85,
  "response_format": {{ "type": "json_object" }},
  "messages": [
    {{ "role": "system", "content": {json.dumps(system)} }},
    {{ "role": "user", "content": {user_expr} }}
  ]
}}"""
    return node(name, "n8n-nodes-base.httpRequest", pos,
        {"method": "POST", "url": "https://api.openai.com/v1/chat/completions",
         "authentication": "genericCredentialType", "genericAuthType": "httpHeaderAuth",
         "sendBody": True, "specifyBody": "json", "jsonBody": body, "options": {}},
        typeVersion=4.2, credentials=OPENAI_CRED, id_num=id_num, **RETRY)

nodes.append(openai_node("Generate Viral Title", [1320, 200],
    "You write high-CTR searchable YouTube titles for English AI automation tutorial channels (Make.com, n8n, Zapier, no-code). Return JSON: { \"viral_title\": string (include year 2026 when natural, max 70 chars), \"hook_text\": string (max 8 words, problem-focused) }",
    '"Topic: {{ $(\'Init Video Job\').first().json.topic }}\\nNiche: {{ $(\'Init Video Job\').first().json.niche }}\\nPrefer titles like: How to..., Best..., X vs Y, Automate... with Make/n8n. Clear value, no misleading clickbait."',
    8))

connections.update(conn("Mark Queue Processing", "Generate Viral Title"))

nodes.append(openai_node("Generate Short Script", [1540, 200],
    "Write 60-second YouTube Shorts tutorial scripts (~150 words) for faceless AI automation channels. Return JSON: { \"short_script\": string }",
    '"Title: {{ JSON.parse($(\'Generate Viral Title\').first().json.choices[0].message.content).viral_title }}\\nTopic: {{ $(\'Init Video Job\').first().json.topic }}\\nHook: pain point in 2 seconds. Explain 1 actionable tip. End: check description for tools."',
    9))

connections.update(conn("Generate Viral Title", "Generate Short Script"))

nodes.append(openai_node("Generate Long Script", [1760, 200],
    "Write 8-10 minute faceless tutorial narration (~1400 words) for AI automation channels. Return JSON: { \"long_script\": string, \"chapters\": [{\"time\": string, \"title\": string}] }",
    '"Title: {{ JSON.parse($(\'Generate Viral Title\').first().json.choices[0].message.content).viral_title }}\\nTopic: {{ $(\'Init Video Job\').first().json.topic }}\\nStructure: hook (pain point), what you will learn, step-by-step concepts (Make.com/n8n/Zapier/no-code), common mistakes, recap, CTA to check description for tool links. No fictional stories."',
    10))

connections.update(conn("Generate Short Script", "Generate Long Script"))

nodes.append(openai_node("Generate Scene Prompts", [1980, 200],
    "Create scene-by-scene visual prompts for faceless SaaS tutorial videos. Return JSON: { \"scenes\": [{ \"id\": number, \"duration_sec\": number, \"visual_prompt\": string, \"motion\": string, \"narration_excerpt\": string }] }. 12 scenes for Short, 24 for long.",
    '"Short script: {{ JSON.parse($(\'Generate Short Script\').first().json.choices[0].message.content).short_script }}\\nLong script excerpt: {{ JSON.parse($(\'Generate Long Script\').first().json.choices[0].message.content).long_script.slice(0,2000) }}\\nVisual style: modern tech explainer, abstract dashboards, workflow nodes, laptops, automation icons, clean blue/purple lighting, professional, no readable text, no logos."',
    11))

connections.update(conn("Generate Long Script", "Generate Scene Prompts"))

PARSE_SCENES = r"""const job = $('Init Video Job').first().json;
const title = JSON.parse($('Generate Viral Title').first().json.choices[0].message.content);
const short = JSON.parse($('Generate Short Script').first().json.choices[0].message.content);
const long = JSON.parse($('Generate Long Script').first().json.choices[0].message.content);
const scenes = JSON.parse($('Generate Scene Prompts').first().json.choices[0].message.content).scenes || [];
return scenes.map(s => ({ json: { ...job, viral_title: title.viral_title, hook_text: title.hook_text, short_script: short.short_script, long_script: long.long_script, scene: s } }));"""

nodes.append(node("Split Scenes", "n8n-nodes-base.code", [2200, 200],
    {"mode": "runOnceForAllItems", "jsCode": PARSE_SCENES}, typeVersion=2, id_num=12))

connections.update(conn("Generate Scene Prompts", "Split Scenes"))

# DALL-E for scene images (reliable fallback for AI video)
nodes.append(node("Generate Scene Image", "n8n-nodes-base.httpRequest", [2420, 200],
    {"method": "POST", "url": "https://api.openai.com/v1/images/generations",
     "authentication": "genericCredentialType", "genericAuthType": "httpHeaderAuth",
     "sendBody": True, "specifyBody": "json",
     "jsonBody": '={\n  "model": "{{ $vars.OPENAI_IMAGE_MODEL || \'dall-e-3\' }}",\n  "prompt": "{{ $json.scene.visual_prompt }}, modern SaaS tech explainer, 16:9, clean professional lighting, abstract UI, no text, no logos",\n  "n": 1,\n  "size": "1792x1024"\n}',
     "options": {}},
    typeVersion=4.2, credentials=OPENAI_CRED, id_num=13, **RETRY))

connections.update(conn("Split Scenes", "Generate Scene Image"))

# Optional Runway video gen
nodes.append(node("Runway Video Gen (Optional)", "n8n-nodes-base.httpRequest", [2640, 200],
    {"method": "POST", "url": "https://api.dev.runwayml.com/v1/image_to_video",
     "sendHeaders": True, "headerParameters": {"parameters": [
         {"name": "Authorization", "value": "=Bearer {{ $vars.RUNWAY_API_KEY }}"},
         {"name": "X-Runway-Version", "value": "2024-11-06"}
     ]},
     "sendBody": True, "specifyBody": "json",
     "jsonBody": '={\n  "promptImage": "{{ $json.data[0].url || $json.scene_assets?.image_url }}",\n  "promptText": "{{ $json.scene.visual_prompt }}",\n  "model": "gen3a_turbo",\n  "duration": 5\n}',
     "options": {"response": {"response": {"neverError": True}}}},
    typeVersion=4.2, id_num=14, onError="continueRegularOutput"))

connections.update(conn("Generate Scene Image", "Runway Video Gen (Optional)"))

COLLECT_SCENES = r"""const items = $input.all();
const job = $('Init Video Job').first().json;
const title = JSON.parse($('Generate Viral Title').first().json.choices[0].message.content);
const short = JSON.parse($('Generate Short Script').first().json.choices[0].message.content);
const long = JSON.parse($('Generate Long Script').first().json.choices[0].message.content);
const sceneAssets = items.map((it, i) => {
  const img = $('Generate Scene Image').all()[i]?.json?.data?.[0]?.url;
  const runway = it.json?.id || it.json?.task_id;
  return { id: i + 1, image_url: img, video_task_id: runway || null, prompt: it.json.scene?.visual_prompt };
});
return [{ json: { ...job, viral_title: title.viral_title, hook_text: title.hook_text, short_script: short.short_script, long_script: long.long_script, scene_assets_json: JSON.stringify(sceneAssets) } }];"""

nodes.append(node("Collect Scene Assets", "n8n-nodes-base.code", [2860, 200],
    {"mode": "runOnceForAllItems", "jsCode": COLLECT_SCENES}, typeVersion=2, id_num=15))

connections.update(conn("Runway Video Gen (Optional)", "Collect Scene Assets"))

# ElevenLabs voiceovers
def elevenlabs_node(name, pos, script_node, script_field, filename, id_num):
    text_expr = f"JSON.stringify(JSON.parse($('{script_node}').first().json.choices[0].message.content).{script_field})"
    return node(name, "n8n-nodes-base.httpRequest", pos,
        {"method": "POST",
         "url": "=https://api.elevenlabs.io/v1/text-to-speech/{{ $('Init Video Job').first().json.voiceId }}",
         "sendHeaders": True,
         "headerParameters": {"parameters": [
             {"name": "xi-api-key", "value": "={{ $vars.ELEVENLABS_API_KEY }}"},
             {"name": "Content-Type", "value": "application/json"},
             {"name": "Accept", "value": "audio/mpeg"}
         ]},
         "sendBody": True, "specifyBody": "json",
         "jsonBody": f'={{\n  "text": {{{{ {text_expr} }}}},\n  "model_id": "{{{{ $vars.ELEVENLABS_MODEL || \'eleven_multilingual_v2\' }}}}",\n  "voice_settings": {{ "stability": 0.5, "similarity_boost": 0.75 }}\n}}',
         "options": {"response": {"response": {"responseFormat": "file", "outputPropertyName": filename}}}},
        typeVersion=4.2, id_num=id_num, **RETRY)

nodes.append(elevenlabs_node("ElevenLabs Short Voiceover", [3080, 120],
    "Generate Short Script", "short_script", "voiceover_short", 16))

nodes.append(node("Upload Short Voiceover", "n8n-nodes-base.httpRequest", [3300, 120],
    {"method": "POST", "url": "https://tmpfiles.org/api/v1/upload",
     "sendBody": True, "contentType": "multipart-form-data",
     "bodyParameters": {"parameters": [
         {"parameterType": "formBinaryData", "name": "file", "inputDataFieldName": "voiceover_short"}
     ]}, "options": {}},
    typeVersion=4.2, id_num=44, **RETRY))

nodes.append(node("Parse Voiceover URL", "n8n-nodes-base.code", [3520, 120],
    {"mode": "runOnceForAllItems",
     "jsCode": r"""const upload = $input.first().json;
const raw = upload?.data?.url || upload?.url || '';
const voiceover_url = raw.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
const job = $('Collect Scene Assets').first().json;
return [{ json: { ...job, voiceover_short_url: voiceover_url } }];"""},
    typeVersion=2, id_num=45))

nodes.append(elevenlabs_node("ElevenLabs Long Voiceover", [3080, 280],
    "Generate Long Script", "long_script", "voiceover_long", 17))

connections.update(conn("Collect Scene Assets", "ElevenLabs Short Voiceover"))
connections.update(conn("ElevenLabs Short Voiceover", "Upload Short Voiceover"))
connections.update(conn("Upload Short Voiceover", "Parse Voiceover URL"))
connections.update(conn("Collect Scene Assets", "ElevenLabs Long Voiceover"))

CAPTIONS_CODE = r"""const short = JSON.parse($('Generate Short Script').first().json.choices[0].message.content).short_script;
const words = short.split(/\s+/);
const wps = 2.5;
let srt = '';
let t = 0;
const chunks = [];
for (let i = 0; i < words.length; i += 6) chunks.push(words.slice(i, i + 6).join(' '));
chunks.forEach((chunk, idx) => {
  const start = t;
  const dur = chunk.split(' ').length / wps;
  t += dur;
  const fmt = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60),ms=Math.floor((s%1)*1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`; };
  srt += `${idx+1}\n${fmt(start)} --> ${fmt(t)}\n${chunk}\n\n`;
});
const job = $('Parse Voiceover URL').first().json;
return [{ json: { ...job, captions_srt: srt } }];"""

nodes.append(node("Generate Captions SRT", "n8n-nodes-base.code", [3740, 200],
    {"mode": "runOnceForAllItems", "jsCode": CAPTIONS_CODE}, typeVersion=2, id_num=18))

connections.update(conn("Parse Voiceover URL", "Generate Captions SRT"))
connections.update(conn("ElevenLabs Long Voiceover", "Generate Captions SRT"))

nodes.append(openai_node("Generate Thumbnail Prompt", [3960, 200],
    "Return JSON: { \"thumbnail_prompt\": string } for a high-CTR YouTube tutorial thumbnail. Bold composition, 1280x720, large readable title words allowed in design mockup only.",
    '"Title: {{ $(\'Collect Scene Assets\').first().json.viral_title }}\\nTopic: {{ $(\'Init Video Job\').first().json.topic }}\\nStyle: tech tutorial, automation/workflow theme, bright contrast, faceless, icons (gears, nodes, laptop), not horror, not true crime."',
    19))

connections.update(conn("Generate Captions SRT", "Generate Thumbnail Prompt"))

nodes.append(node("Generate Thumbnail Image", "n8n-nodes-base.httpRequest", [4180, 200],
    {"method": "POST", "url": "https://api.openai.com/v1/images/generations",
     "authentication": "genericCredentialType", "genericAuthType": "httpHeaderAuth",
     "sendBody": True, "specifyBody": "json",
     "jsonBody": '={\n  "model": "{{ $vars.OPENAI_IMAGE_MODEL || \'dall-e-3\' }}",\n  "prompt": "{{ JSON.parse($(\'Generate Thumbnail Prompt\').first().json.choices[0].message.content).thumbnail_prompt }}",\n  "n": 1,\n  "size": "1792x1024"\n}',
     "options": {}},
    typeVersion=4.2, credentials=OPENAI_CRED, id_num=20, **RETRY))

connections.update(conn("Generate Thumbnail Prompt", "Generate Thumbnail Image"))

nodes.append(openai_node("Generate SEO Metadata", [4400, 200],
    "Return JSON: { \"seo_title\": string (max 100 chars), \"seo_description\": string (with chapters/timestamps + affiliate disclosure + placeholder tool links), \"seo_tags\": string (comma-separated, 15 tags) }",
    '"Title: {{ $(\'Collect Scene Assets\').first().json.viral_title }}\\nTopic: {{ $(\'Init Video Job\').first().json.topic }}\\nNiche: AI workflow automation for business. Chapters: {{ JSON.parse($(\'Generate Long Script\').first().json.choices[0].message.content).chapters }}\\nInclude in description: affiliate disclosure line, sections Tools Mentioned and Timestamps, tags like automation, n8n, make.com, zapier, no-code, ai tools."',
    21))

connections.update(conn("Generate Thumbnail Image", "Generate SEO Metadata"))

BUILD_CREATOMATE = r"""const job = $('Generate Captions SRT').first().json;
const voice = $('Parse Voiceover URL').first().json;
const seo = JSON.parse($('Generate SEO Metadata').first().json.choices[0].message.content);
const thumb = $('Generate Thumbnail Image').first().json.data[0].url;
const thumbPrompt = JSON.parse($('Generate Thumbnail Prompt').first().json.choices[0].message.content);
const scenes = JSON.parse(job.scene_assets_json);
const modifications = {
  voiceover_url: voice.voiceover_short_url,
  hook_text: job.hook_text,
  captions_srt: job.captions_srt,
  thumbnail_url: thumb
};
scenes.forEach((s, i) => { modifications[`scene_${i+1}_url`] = s.image_url; });
return [{ json: { ...job, voiceover_short_url: voice.voiceover_short_url, thumbnail_url: thumb, thumbnail_prompt: thumbPrompt.thumbnail_prompt, seo_title: seo.seo_title, seo_description: seo.seo_description, seo_tags: seo.seo_tags, creatomate_modifications: modifications } }];"""

nodes.append(node("Build Creatomate Payload", "n8n-nodes-base.code", [4620, 200],
    {"mode": "runOnceForAllItems", "jsCode": BUILD_CREATOMATE}, typeVersion=2, id_num=22))

connections.update(conn("Generate SEO Metadata", "Build Creatomate Payload"))

nodes.append(node("Render Short via Creatomate", "n8n-nodes-base.httpRequest", [4840, 120],
    {"method": "POST", "url": "https://api.creatomate.com/v1/renders",
     "sendHeaders": True,
     "headerParameters": {"parameters": [
         {"name": "Authorization", "value": "=Bearer {{ $vars.CREATOMATE_API_KEY }}"},
         {"name": "Content-Type", "value": "application/json"}
     ]},
     "sendBody": True, "specifyBody": "json",
     "jsonBody": '={\n  "template_id": "{{ $(\'Build Creatomate Payload\').first().json.creatomateShortTpl }}",\n  "modifications": {{ JSON.stringify($json.creatomate_modifications) }}\n}',
     "options": {}},
    typeVersion=4.2, id_num=24, **RETRY))

connections.update(conn("Build Creatomate Payload", "Render Short via Creatomate"))

nodes.append(node("Wait for Short Render", "n8n-nodes-base.wait", [5060, 120],
    {"amount": 30, "unit": "seconds"}, typeVersion=1.1, id_num=25))

connections.update(conn("Render Short via Creatomate", "Wait for Short Render"))

nodes.append(node("Poll Short Render Status", "n8n-nodes-base.httpRequest", [5280, 120],
    {"method": "GET",
     "url": "=https://api.creatomate.com/v1/renders/{{ $('Render Short via Creatomate').first().json.id }}",
     "sendHeaders": True,
     "headerParameters": {"parameters": [{"name": "Authorization", "value": "=Bearer {{ $vars.CREATOMATE_API_KEY }}"}]},
     "options": {}},
    typeVersion=4.2, id_num=26, **RETRY))

connections.update(conn("Wait for Short Render", "Poll Short Render Status"))

nodes.append(node("Render Long via Creatomate", "n8n-nodes-base.httpRequest", [4840, 280],
    {"method": "POST", "url": "https://api.creatomate.com/v1/renders",
     "sendHeaders": True,
     "headerParameters": {"parameters": [
         {"name": "Authorization", "value": "=Bearer {{ $vars.CREATOMATE_API_KEY }}"},
         {"name": "Content-Type", "value": "application/json"}
     ]},
     "sendBody": True, "specifyBody": "json",
     "jsonBody": '={\n  "template_id": "{{ $(\'Build Creatomate Payload\').first().json.creatomateLongTpl }}",\n  "modifications": {{ JSON.stringify($json.creatomate_modifications) }}\n}',
     "options": {}},
    typeVersion=4.2, id_num=27, **RETRY))

nodes.append(node("Wait for Long Render", "n8n-nodes-base.wait", [5060, 280],
    {"amount": 120, "unit": "seconds"}, typeVersion=1.1, id_num=28))

nodes.append(node("Poll Long Render Status", "n8n-nodes-base.httpRequest", [5280, 280],
    {"method": "GET",
     "url": "=https://api.creatomate.com/v1/renders/{{ $('Render Long via Creatomate').first().json.id }}",
     "sendHeaders": True,
     "headerParameters": {"parameters": [{"name": "Authorization", "value": "=Bearer {{ $vars.CREATOMATE_API_KEY }}"}]},
     "options": {}},
    typeVersion=4.2, id_num=29, **RETRY))

connections.update(conn("Build Creatomate Payload", "Render Long via Creatomate"))
connections.update(conn("Render Long via Creatomate", "Wait for Long Render"))
connections.update(conn("Wait for Long Render", "Poll Long Render Status"))

nodes.append(node("Merge Render Results", "n8n-nodes-base.merge", [5280, 200],
    {"mode": "combine", "combineBy": "combineAll", "options": {}}, typeVersion=3, id_num=30))

connections["Poll Short Render Status"] = {"main": [[{"node": "Merge Render Results", "type": "main", "index": 0}]]}
connections["Poll Long Render Status"] = {"main": [[{"node": "Merge Render Results", "type": "main", "index": 1}]]}

PREP_UPLOAD = r"""const payload = $('Build Creatomate Payload').first().json;
const shortRender = $('Poll Short Render Status').first().json;
const longRender = $('Poll Long Render Status').first().json;
return [{ json: {
  ...payload,
  final_short_url: shortRender.url || shortRender[0]?.url,
  final_long_url: longRender.url || longRender[0]?.url,
  creatomate_short_render_id: shortRender.id,
  creatomate_long_render_id: longRender.id,
  updated_at: new Date().toISOString()
}}];"""

nodes.append(node("Prepare Upload Data", "n8n-nodes-base.code", [5500, 200],
    {"mode": "runOnceForAllItems", "jsCode": PREP_UPLOAD}, typeVersion=2, id_num=31))

connections.update(conn("Merge Render Results", "Prepare Upload Data"))

nodes.append(node("Download Short Video", "n8n-nodes-base.httpRequest", [5720, 120],
    {"method": "GET", "url": "={{ $json.final_short_url }}",
     "options": {"response": {"response": {"responseFormat": "file", "outputPropertyName": "video_short"}}}},
    typeVersion=4.2, id_num=32, **RETRY))

nodes.append(node("Upload Short to YouTube", "n8n-nodes-base.youTube", [5940, 120],
    {"resource": "video", "operation": "upload",
     "title": "={{ $json.seo_title }} #Shorts",
     "categoryId": "={{ $vars.YOUTUBE_DEFAULT_CATEGORY || 28 }}",
     "options": {"description": "={{ $json.seo_description }}", "tags": "={{ $json.seo_tags }}", "privacyStatus": "={{ $vars.YOUTUBE_DEFAULT_PRIVACY || 'public' }}"},
     "binaryProperty": "video_short"},
    typeVersion=1, credentials=YOUTUBE_CRED, id_num=33, **RETRY))

connections.update(conn("Prepare Upload Data", "Download Short Video"))
connections.update(conn("Download Short Video", "Upload Short to YouTube"))

nodes.append(node("Download Long Video", "n8n-nodes-base.httpRequest", [5720, 280],
    {"method": "GET", "url": "={{ $json.final_long_url }}",
     "options": {"response": {"response": {"responseFormat": "file", "outputPropertyName": "video_long"}}}},
    typeVersion=4.2, id_num=34, **RETRY))

nodes.append(node("Upload Long to YouTube", "n8n-nodes-base.youTube", [5940, 280],
    {"resource": "video", "operation": "upload",
     "title": "={{ $json.seo_title }}",
     "categoryId": "={{ $vars.YOUTUBE_DEFAULT_CATEGORY || 28 }}",
     "options": {"description": "={{ $json.seo_description }}", "tags": "={{ $json.seo_tags }}", "privacyStatus": "={{ $vars.YOUTUBE_DEFAULT_PRIVACY || 'public' }}"},
     "binaryProperty": "video_long"},
    typeVersion=1, credentials=YOUTUBE_CRED, id_num=35, **RETRY))

connections.update(conn("Prepare Upload Data", "Download Long Video"))
connections.update(conn("Download Long Video", "Upload Long to YouTube"))

nodes.append(node("Merge YouTube Uploads", "n8n-nodes-base.merge", [6160, 200],
    {"mode": "combine", "combineBy": "combineAll", "options": {}}, typeVersion=3, id_num=36))

connections["Upload Short to YouTube"] = {"main": [[{"node": "Merge YouTube Uploads", "type": "main", "index": 0}]]}
connections["Upload Long to YouTube"] = {"main": [[{"node": "Merge YouTube Uploads", "type": "main", "index": 1}]]}

FINAL_SAVE = r"""const prep = $('Prepare Upload Data').first().json;
const shortYt = $('Upload Short to YouTube').first().json;
const longYt = $('Upload Long to YouTube').first().json;
return [{ json: {
  ...prep,
  status: 'completed',
  youtube_short_id: shortYt.id,
  youtube_long_id: longYt.id,
  youtube_short_url: `https://youtube.com/shorts/${shortYt.id}`,
  youtube_long_url: `https://youtube.com/watch?v=${longYt.id}`,
  created_at: prep.started_at,
  completed_at: new Date().toISOString()
}}];"""

nodes.append(node("Finalize Content Record", "n8n-nodes-base.code", [6380, 200],
    {"mode": "runOnceForAllItems", "jsCode": FINAL_SAVE}, typeVersion=2, id_num=37))

connections.update(conn("Merge YouTube Uploads", "Finalize Content Record"))

nodes.append(node("Save Content to Sheets", "n8n-nodes-base.googleSheets", [6600, 200],
    {"operation": "append",
     "documentId": {"__rl": True, "value": "={{ $json.sheetId }}", "mode": "id"},
     "sheetName": {"__rl": True, "value": "={{ $json.contentTab }}", "mode": "name"},
     "columns": {"mappingMode": "autoMapInputData", "value": {}}, "options": {}},
    typeVersion=4.5, credentials=SHEETS_CRED, id_num=38, **RETRY))

connections.update(conn("Finalize Content Record", "Save Content to Sheets"))

nodes.append(node("Mark Queue Completed", "n8n-nodes-base.googleSheets", [6820, 200],
    {"operation": "update",
     "documentId": {"__rl": True, "value": "={{ $json.sheetId }}", "mode": "id"},
     "sheetName": {"__rl": True, "value": "={{ $json.queueTab }}", "mode": "name"},
     "columns": {"mappingMode": "defineBelow",
                 "value": {"status": "completed", "completed_at": "={{ $json.completed_at }}"},
                 "matchingColumns": ["queue_id"]}, "options": {}},
    typeVersion=4.5, credentials=SHEETS_CRED, id_num=39))

connections.update(conn("Save Content to Sheets", "Mark Queue Completed"))

nodes.append(node("Log Production Success", "n8n-nodes-base.googleSheets", [7040, 200],
    {"operation": "append",
     "documentId": {"__rl": True, "value": "={{ $json.sheetId }}", "mode": "id"},
     "sheetName": {"__rl": True, "value": "={{ $vars.GOOGLE_SHEETS_LOGS_TAB || 'Logs' }}", "mode": "name"},
     "columns": {"mappingMode": "defineBelow", "value": {
         "log_id": "={{ $json.video_id }}",
         "timestamp": "={{ $now.toISO() }}",
         "level": "info",
         "workflow": "02-video-production",
         "message": "=Video published: {{ $json.youtube_long_url }}",
         "metadata_json": "={{ JSON.stringify({ queue_id: $json.queue_id, topic: $json.topic }) }}"
     }}, "options": {}},
    typeVersion=4.5, credentials=SHEETS_CRED, id_num=40))

connections.update(conn("Mark Queue Completed", "Log Production Success"))

# Error handling nodes
nodes.append(node("On Workflow Error", "n8n-nodes-base.errorTrigger", [0, 600], {}, id_num=41))
nodes.append(node("Call Error Handler", "n8n-nodes-base.executeWorkflow", [220, 600],
    {"workflowId": {"__rl": True, "value": "={{ $vars.WORKFLOW_ERROR_HANDLER_ID }}", "mode": "id"},
     "workflowInputs": {"mappingMode": "defineBelow", "value": {
         "workflow": "02-video-production",
         "error_message": "={{ $json.execution.error.message }}",
         "node_name": "={{ $json.execution.lastNodeExecuted }}",
         "queue_id": "={{ $json.execution?.data?.[0]?.json?.queue_id || '' }}",
         "metadata_json": "={{ JSON.stringify($json.execution) }}"
     }}}, typeVersion=1.2, id_num=42))

connections.update(conn("On Workflow Error", "Call Error Handler"))

nodes.append(node("No Items - Skip", "n8n-nodes-base.noOp", [880, 420], {}, id_num=43))
connections["Has Processable Item?"] = {"main": [
    [{"node": "Init Video Job", "type": "main", "index": 0}],
    [{"node": "No Items - Skip", "type": "main", "index": 0}]
]}

workflow = {
    "name": "YouTube Automation - 02 Video Production Pipeline",
    "nodes": nodes,
    "connections": connections,
    "pinData": {},
    "settings": {
        "executionOrder": "v1",
        "timezone": "America/New_York",
        "saveManualExecutions": True,
        "callerPolicy": "workflowsFromSameOwner"
    },
    "staticData": None,
    "tags": [{"name": "youtube-automation"}],
    "meta": {"templateCredsSetupCompleted": False, "instanceId": "youtube-automation-system"}
}

out = r"c:\Users\admin\.cursor\n8n-youtube-automation\workflows\02-video-production-pipeline.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(workflow, f, indent=2)

print(f"Generated {out} with {len(nodes)} nodes")
