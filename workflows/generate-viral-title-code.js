const job = $input.first().json;
const topic = String(job.topic || 'AI automation').trim();
const niche = String(job.niche || $vars.CHANNEL_NICHE || '').trim();

const apiKey = String($vars.OPENAI_API_KEY || '').trim().replace(/^Bearer\s+/i, '');
if (!apiKey) {
  throw new Error('OPENAI_API_KEY missing. Go to Settings → Variables and add OPENAI_API_KEY = sk-proj-... (key only, no Bearer).');
}

const payload = {
  model: 'gpt-4o',
  temperature: 0.85,
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: 'Return JSON with viral_title and hook_text fields.' },
    { role: 'user', content: 'Topic: ' + topic + '\nNiche: ' + niche + '\nWrite a viral YouTube title for an AI automation channel.' },
  ],
};

let response;
try {
  response = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: payload,
    json: true,
  });
} catch (e) {
  const detail = e.response?.body ?? e.response?.data ?? e.message ?? e;
  throw new Error('OpenAI error: ' + (typeof detail === 'object' ? JSON.stringify(detail) : String(detail)));
}

return [{ json: response }];
