const fs = require('fs');
const path = require('path');

const SRC = 'c:/Users/admin/Downloads/YouTube Automation - FIXED.json';
const DST = 'c:/Users/admin/Downloads/YouTube Automation - FIXED.json';
const DST_COPY = 'c:/Users/admin/.cursor/n8n-youtube-automation/workflows/YouTube-Automation-PRODUCTION.json';

const OPENAI_CRED = { httpHeaderAuth: { id: 'Cx2GwShZqOGodlWH', name: 'Header Auth account' } };
const SHEETS_CRED = { googleSheetsOAuth2Api: { id: 'b34Im1YM43gUfAuZ', name: 'Google Sheets account' } };
const YOUTUBE_CRED = { youTubeOAuth2Api: { id: 'YOUTUBE_OAUTH2', name: 'YouTube OAuth2 account' } };

const SHEET_ID = '1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0';
const RETRY = { retryOnFail: true, maxTries: 3, waitBetweenTries: 8000 };

const VIRAL_TITLE_HTTP = {
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={\n  "model": "{{ $('Init Video Job').first().json.openaiModel || 'gpt-4o' }}",\n  "temperature": 0.85,\n  "response_format": { "type": "json_object" },\n  "messages": [\n    { "role": "system", "content": "You write high-CTR searchable YouTube titles for English AI automation tutorial channels (Make.com, n8n, Zapier, no-code). Return JSON: { \\"viral_title\\": string (include year 2026 when natural, max 70 chars), \\"hook_text\\": string (max 8 words, problem-focused) }" },\n    { "role": "user", "content": "Topic: {{ $('Init Video Job').first().json.topic }}\\nNiche: {{ $('Init Video Job').first().json.niche }}\\nPrefer titles like: How to..., Best..., X vs Y, Automate... with Make/n8n. Clear value, no misleading clickbait." }\n  ]\n}`,
  options: { timeout: 120000 },
};

const BUILD_QUEUE_CODE = `const config = $('Merge Topic Sources').first().json;
const ai = $input.first().json;

let topics = [];
try {
  const content = ai?.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  topics = parsed.topics || (Array.isArray(parsed) ? parsed : []);
} catch (e) {
  const fallbackTopic = config.niche || 'AI Workflow Automation Tutorial';
  topics = [{ topic: fallbackTopic + ' - ' + new Date().toISOString().slice(0, 10), angle: 'fallback', priority: 5 }];
}

if (!Array.isArray(topics)) topics = [topics];
if (topics.length === 0) {
  topics = [{ topic: 'How to Automate Your Business with n8n in 2026', angle: 'default', priority: 5 }];
}

const { randomUUID } = require('crypto');
const now = new Date();
const delayMinutes = 72;
const limit = Math.max(1, parseInt(config.videosPerDay || 20, 10));

const queueItems = topics.slice(0, limit).map((t, i) => {
  const scheduled = new Date(now.getTime() + i * delayMinutes * 60 * 1000);
  return {
    queue_id: randomUUID(),
    status: 'pending',
    topic: (t.topic || t || 'AI automation tutorial').toString().trim(),
    source: t.source || 'ai_generated',
    priority: t.priority || (10 - i),
    retry_count: 0,
    scheduled_at: scheduled.toISOString(),
    started_at: '',
    completed_at: '',
    error_message: ''
  };
});

return queueItems.map(item => ({ json: item }));`;

const SAFE_PARSE = `function safeParse(nodeName, field) {
  try {
    const raw = $(nodeName).first()?.json?.choices?.[0]?.message?.content;
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) { return {}; }
}`;

const SPLIT_SCENES_CODE = `${SAFE_PARSE}
const job = $('Init Video Job').first().json;
const title = safeParse('Generate Viral Title');
const short = safeParse('Generate Short Script');
const long = safeParse('Generate Long Script');
const scenesData = safeParse('Generate Scene Prompts');
const scenes = scenesData.scenes || [];
if (scenes.length === 0) {
  return [{ json: { ...job, viral_title: title.viral_title || job.topic, hook_text: title.hook_text || 'Learn automation', short_script: short.short_script || '', long_script: long.long_script || '', scene: { id: 1, duration_sec: 5, visual_prompt: 'modern tech dashboard automation workflow', motion: 'slow zoom', narration_excerpt: '' } } }];
}
return scenes.map(s => ({ json: { ...job, viral_title: title.viral_title || job.topic, hook_text: title.hook_text || '', short_script: short.short_script || '', long_script: long.long_script || '', scene: s } }));`;

const COLLECT_SCENES_CODE = `${SAFE_PARSE}
const items = $input.all();
const job = $('Init Video Job').first().json;
const title = safeParse('Generate Viral Title');
const short = safeParse('Generate Short Script');
const long = safeParse('Generate Long Script');
const sceneAssets = items.map((it, i) => {
  const img = $('Generate Scene Image').all()[i]?.json?.data?.[0]?.url || '';
  const runway = it.json?.id || it.json?.task_id || null;
  return { id: i + 1, image_url: img, video_task_id: runway, prompt: it.json.scene?.visual_prompt || '' };
});
return [{ json: { ...job, viral_title: title.viral_title || job.topic, hook_text: title.hook_text || '', short_script: short.short_script || '', long_script: long.long_script || '', scene_assets_json: JSON.stringify(sceneAssets) } }];`;

const BUILD_CREATOMATE_CODE = `${SAFE_PARSE}
const job = $('Generate Captions SRT').first().json;
const voice = $('Parse Voiceover URL').first().json;
const seo = safeParse('Generate SEO Metadata');
const thumb = $('Generate Thumbnail Image').first()?.json?.data?.[0]?.url || '';
const thumbPrompt = safeParse('Generate Thumbnail Prompt');
let scenes = [];
try { scenes = JSON.parse(job.scene_assets_json || '[]'); } catch (e) { scenes = []; }
const modifications = {
  voiceover_url: voice?.voiceover_short_url || '',
  hook_text: job.hook_text || '',
  captions_srt: job.captions_srt || '',
  thumbnail_url: thumb
};
scenes.forEach((s, i) => { modifications['scene_' + (i + 1) + '_url'] = s.image_url || ''; });
return [{ json: { ...job, voiceover_short_url: voice?.voiceover_short_url || '', thumbnail_url: thumb, thumbnail_prompt: thumbPrompt.thumbnail_prompt || '', seo_title: seo.seo_title || job.viral_title || job.topic, seo_description: seo.seo_description || '', seo_tags: seo.seo_tags || 'automation,n8n,make.com,ai', creatomate_modifications: modifications } }];`;

const PREP_UPLOAD_CODE = `const payload = $('Build Creatomate Payload').first().json;
const shortRender = $('Poll Short Render Status').first()?.json || {};
const longRender = $('Poll Long Render Status').first()?.json || {};
return [{ json: {
  ...payload,
  final_short_url: shortRender.url || shortRender[0]?.url || '',
  final_long_url: longRender.url || longRender[0]?.url || '',
  creatomate_short_render_id: shortRender.id || '',
  creatomate_long_render_id: longRender.id || '',
  updated_at: new Date().toISOString()
}}];`;

const FINALIZE_CODE = `const prep = $('Prepare Upload Data').first().json;
const shortYt = $('Upload Short to YouTube').first()?.json || {};
const longYt = $('Upload Long to YouTube').first()?.json || {};
return [{ json: {
  ...prep,
  status: 'completed',
  youtube_short_id: shortYt.id || '',
  youtube_long_id: longYt.id || '',
  youtube_short_url: shortYt.id ? 'https://youtube.com/shorts/' + shortYt.id : '',
  youtube_long_url: longYt.id ? 'https://youtube.com/watch?v=' + longYt.id : '',
  created_at: prep.started_at,
  completed_at: new Date().toISOString()
}}];`;

const CAPTIONS_CODE = `${SAFE_PARSE}
const shortData = safeParse('Generate Short Script');
const short = shortData.short_script || 'Automation tutorial';
const words = short.split(/\\s+/).filter(Boolean);
const wps = 2.5;
let srt = '';
let t = 0;
const chunks = [];
for (let i = 0; i < words.length; i += 6) chunks.push(words.slice(i, i + 6).join(' '));
chunks.forEach((chunk, idx) => {
  const start = t;
  const dur = Math.max(1, chunk.split(' ').length) / wps;
  t += dur;
  const fmt = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60),ms=Math.floor((s%1)*1000); return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')+','+String(ms).padStart(3,'0'); };
  srt += (idx+1)+'\\n'+fmt(start)+' --> '+fmt(t)+'\\n'+chunk+'\\n\\n';
});
const job = $('Parse Voiceover URL').first().json;
return [{ json: { ...job, captions_srt: srt } }];`;

const PARSE_VOICE_CODE = `const upload = $input.first().json;
const raw = upload?.data?.url || upload?.url || '';
const voiceover_url = raw ? raw.replace('tmpfiles.org/', 'tmpfiles.org/dl/') : '';
const job = $('Collect Scene Assets').first().json;
return [{ json: { ...job, voiceover_short_url: voiceover_url } }];`;

function walk(obj, fn) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) return obj.map(x => walk(x, fn));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = walk(v, fn);
    return out;
  }
  return obj;
}

function fixString(s) {
  return s
    .replace(/==\{\{/g, '={{')
    .replace(/=1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0\\n/g, '=' + SHEET_ID)
    .replace(/=Bearer \{\{ \$vars\.CREATOMATE_API_KEY \}\}\\n/g, '=Bearer {{ $vars.CREATOMATE_API_KEY }}')
    .replace(/\{\{ \$vars\.WORKFLOW_ERROR_HANDLER_ID \}\}  /g, '={{ $vars.WORKFLOW_ERROR_HANDLER_ID }}')
    .replace(/"model": "gpt-4o"/g, '"model": "{{ $(\'Init Video Job\').first().json.openaiModel || \'gpt-4o\' }}"')
    .replace(/"model": "dall-e-3"/g, '"model": "{{ $vars.OPENAI_IMAGE_MODEL || \'dall-e-3\' }}"')
    .replace(/"queue_id": "\{\{ \$\('Normalize Error Payload'\)/g, '"queue_id": "={{ $(\'Normalize Error Payload\')')
    .replace(/=1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0\\n"/g, '=' + SHEET_ID + '"');
}

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
data.name = 'AI Workflow Automation for Business';
data.settings = {
  executionOrder: 'v1',
  timezone: 'America/New_York',
  saveManualExecutions: true,
  callerPolicy: 'workflowsFromSameOwner',
};
delete data.settings.errorWorkflow;
data.tags = [{ name: 'youtube-automation' }];
data.meta = { templateCredsSetupCompleted: true, instanceId: 'youtube-automation-production' };

const nodeMap = {};
for (const n of data.nodes) nodeMap[n.name] = n;

// Fix Generate Viral Title: convert Code -> HTTP Request
const viralIdx = data.nodes.findIndex(n => n.name === 'Generate Viral Title');
if (viralIdx >= 0) {
  const old = data.nodes[viralIdx];
  data.nodes[viralIdx] = {
    id: old.id,
    name: old.name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: old.position,
    parameters: VIRAL_TITLE_HTTP,
    credentials: OPENAI_CRED,
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 8000,
  };
}

const codePatches = {
  'Build Queue Items': BUILD_QUEUE_CODE,
  'Split Scenes': SPLIT_SCENES_CODE,
  'Collect Scene Assets': COLLECT_SCENES_CODE,
  'Build Creatomate Payload': BUILD_CREATOMATE_CODE,
  'Prepare Upload Data': PREP_UPLOAD_CODE,
  'Finalize Content Record': FINALIZE_CODE,
  'Generate Captions SRT': CAPTIONS_CODE,
  'Parse Voiceover URL': PARSE_VOICE_CODE,
};

const openaiNodes = new Set([
  'OpenAI Curate Topics', 'Generate Viral Title', 'Generate Short Script', 'Generate Long Script',
  'Generate Scene Prompts', 'Generate Scene Image', 'Generate Thumbnail Prompt', 'Generate Thumbnail Image', 'Generate SEO Metadata',
]);

const continueOnError = new Set([
  'Fetch Reddit n8n', 'Fetch Google News RSS', 'Runway Video Gen (Optional)',
  'Upload Short Voiceover', 'Render Short via Creatomate', 'Render Long via Creatomate',
  'Poll Short Render Status', 'Poll Long Render Status',
]);

for (const n of data.nodes) {
  if (codePatches[n.name]) {
    n.parameters.jsCode = codePatches[n.name];
  }
  if (openaiNodes.has(n.name) && !n.credentials) {
    n.credentials = OPENAI_CRED;
  }
  if (n.type === 'n8n-nodes-base.googleSheets' && !n.credentials) {
    n.credentials = SHEETS_CRED;
  }
  if (n.type === 'n8n-nodes-base.youTube') {
    n.credentials = YOUTUBE_CRED;
    Object.assign(n, RETRY);
  }
  if (n.name === 'Get Next Pending Item') {
    n.parameters.operation = 'read';
    Object.assign(n, RETRY);
    n.onError = 'continueRegularOutput';
  }
  if (n.name === 'Mark Queue Processing') {
    n.parameters.columns = n.parameters.columns || {};
    n.parameters.columns.mappingMode = 'defineBelow';
    n.parameters.columns.value = {
      queue_id: '={{ $json.queue_id }}',
      status: 'processing',
      started_at: '={{ $json.started_at }}',
    };
    n.parameters.columns.matchingColumns = ['queue_id'];
    Object.assign(n, RETRY);
  }
  if (n.name === 'Mark Queue Completed') {
    n.parameters.columns = {
      mappingMode: 'defineBelow',
      value: {
        queue_id: '={{ $json.queue_id }}',
        status: 'completed',
        completed_at: '={{ $json.completed_at }}',
      },
      matchingColumns: ['queue_id'],
    };
    Object.assign(n, RETRY);
  }
  if (n.name === 'Load Config1') {
    const extra = [
      { id: 'c9', name: 'openaiImageModel', value: "={{ $vars.OPENAI_IMAGE_MODEL || 'dall-e-3' }}", type: 'string' },
      { id: 'c10', name: 'elevenlabsModel', value: "={{ $vars.ELEVENLABS_MODEL || 'eleven_multilingual_v2' }}", type: 'string' },
      { id: 'c11', name: 'runwayApiKey', value: '={{ $vars.RUNWAY_API_KEY || "" }}', type: 'string' },
      { id: 'c12', name: 'elevenlabsApiKey', value: '={{ $vars.ELEVENLABS_API_KEY || "" }}', type: 'string' },
      { id: 'c13', name: 'creatomateApiKey', value: '={{ $vars.CREATOMATE_API_KEY || "" }}', type: 'string' },
    ];
    const existing = new Set(n.parameters.assignments.assignments.map(a => a.name));
    for (const a of extra) {
      if (!existing.has(a.name)) n.parameters.assignments.assignments.push(a);
    }
    n.parameters.assignments.assignments = n.parameters.assignments.assignments.filter(
      (a, i, arr) => arr.findIndex(x => x.name === a.name) === i
    );
  }
  if (continueOnError.has(n.name)) {
    n.onError = 'continueRegularOutput';
    if (!n.retryOnFail) Object.assign(n, { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 });
  }
  if (n.type === 'n8n-nodes-base.httpRequest' && !n.retryOnFail && !continueOnError.has(n.name)) {
    Object.assign(n, RETRY);
  }
  if (n.name === 'Call Error Handler' || n.name === 'Call Error Handler1') {
    n.parameters.workflowId.value = '={{ $vars.WORKFLOW_ERROR_HANDLER_ID }}';
    delete n.parameters.workflowId.cachedResultUrl;
  }
  if (n.name === 'Mark Queue for Retry') {
    n.parameters.columns.value.queue_id = "={{ $('Normalize Error Payload').first().json.queue_id }}";
  }
  if (n.type === 'n8n-nodes-base.googleSheets' && n.parameters?.documentId?.value) {
    n.parameters.documentId.value = n.parameters.documentId.value.replace(/\n/g, '').trim();
  }
  if (n.parameters) {
    n.parameters = walk(n.parameters, fixString);
  }
}

// Fix broken connections
data.connections['Collect Scene Assets'] = {
  main: [[
    { node: 'ElevenLabs Short Voiceover', type: 'main', index: 0 },
    { node: 'ElevenLabs Long Voiceover', type: 'main', index: 0 },
  ]],
};

data.connections['Build Creatomate Payload'] = {
  main: [[
    { node: 'Render Short via Creatomate', type: 'main', index: 0 },
    { node: 'Render Long via Creatomate', type: 'main', index: 0 },
  ]],
};

data.connections['Prepare Upload Data'] = {
  main: [[
    { node: 'Download Short Video', type: 'main', index: 0 },
    { node: 'Download Long Video', type: 'main', index: 0 },
  ]],
};

// Add production error trigger
const hasProdError = data.nodes.some(n => n.name === 'On Production Error');
if (!hasProdError) {
  data.nodes.push({
    parameters: {},
    id: 'prod-error-trigger-0001',
    name: 'On Production Error',
    type: 'n8n-nodes-base.errorTrigger',
    typeVersion: 1,
    position: [-6192, -200],
  });
}
data.connections['On Production Error'] = {
  main: [[{ node: 'Call Error Handler1', type: 'main', index: 0 }]],
};

// ElevenLabs model from config
for (const n of data.nodes) {
  if (n.name === 'ElevenLabs Short Voiceover' || n.name === 'ElevenLabs Long Voiceover') {
    n.parameters.jsonBody = n.parameters.jsonBody.replace(
      '"model_id": "eleven_multilingual_v2"',
      '"model_id": "{{ $(\'Init Video Job\').first().json.elevenlabsModel || \'eleven_multilingual_v2\' }}"'
    );
    n.parameters.headerParameters.parameters.find(p => p.name === 'xi-api-key').value =
      "={{ $('Init Video Job').first().json.elevenlabsApiKey || $vars.ELEVENLABS_API_KEY }}";
  }
}

// Creatomate auth from config
for (const n of data.nodes) {
  if (n.name.includes('Creatomate') || n.name.includes('Render') && n.name.includes('Poll')) {
    const auth = n.parameters?.headerParameters?.parameters?.find(p => p.name === 'Authorization');
    if (auth) auth.value = "={{ 'Bearer ' + ($('Init Video Job').first().json.creatomateApiKey || $vars.CREATOMATE_API_KEY || '') }}";
  }
}

// Runway auth from config
const runway = data.nodes.find(n => n.name === 'Runway Video Gen (Optional)');
if (runway) {
  runway.parameters.headerParameters.parameters.find(p => p.name === 'Authorization').value =
    "={{ 'Bearer ' + ($('Init Video Job').first().json.runwayApiKey || $vars.RUNWAY_API_KEY || '') }}";
}

// OpenAI Curate Topics model
const curate = data.nodes.find(n => n.name === 'OpenAI Curate Topics');
if (curate) {
  curate.parameters.jsonBody = curate.parameters.jsonBody.replace(
    '"model": "{{ $(\'Init Video Job\').first().json.openaiModel || \'gpt-4o\' }}"',
    '"model": "{{ $json.openaiModel || \'gpt-4o\' }}"'
  );
}

// Wait nodes need unit
for (const n of data.nodes) {
  if (n.type === 'n8n-nodes-base.wait' && !n.parameters.unit) {
    n.parameters.unit = 'seconds';
  }
}

// HTTP timeout options
for (const n of data.nodes) {
  if (n.type === 'n8n-nodes-base.httpRequest') {
    n.parameters.options = n.parameters.options || {};
    n.parameters.options.timeout = n.parameters.options.timeout || 120000;
    if (n.name.includes('Download')) {
      n.parameters.options.response = n.parameters.options.response || {};
      n.parameters.options.response.response = { responseFormat: 'file', outputPropertyName: n.name.includes('Short') ? 'video_short' : 'video_long' };
    }
  }
}

const out = JSON.stringify(data, null, 2);
fs.writeFileSync(DST, out, 'utf8');
fs.writeFileSync(DST_COPY, out, 'utf8');
console.log('Written:', DST, 'nodes:', data.nodes.length);
