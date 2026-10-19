/* =====================================================================
   부산동부지사 안전 허브 · 브리핑 녹음 정리 서버 (Cloudflare Workers)
   ---------------------------------------------------------------------
   하는 일: 앱이 보낸 녹음 파일을 Gemini 에 보내 "대화 정리 + 회의록"으로 돌려줌
   보안:
     · Gemini 키는 이 코드에 없음 → Cloudflare 의 비밀 변수 GEMINI_KEY 에만 저장
     · 지사 앱에 로그인한 사람(구글 로그인 토큰)만 사용 가능
     · 우리 앱 주소에서 온 요청만 허용
     · 녹음 파일은 저장하지 않음 (Gemini 로 보내고 끝)
   ===================================================================== */
const PROJECT = 'moon0110-50b6f';                       // Firebase 프로젝트
const ORIGINS = ['https://young0110-moon.github.io'];   // 앱 주소
const MODELS  = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview']; // 앞에서부터 시도
const MAX_BYTES = 18 * 1024 * 1024;                     // 녹음 최대 18MB (약 60분)

const PROMPT = `너는 한국승강기안전공단 부산동부지사의 회의 기록 담당자야.
첨부된 녹음은 아침 브리핑(또는 현장 대화)이야. 한국어로 아래 JSON 형식에 맞춰 정리해.
- title: 브리핑 제목 (20자 이내)
- summary: 핵심 요약 3문장 이내
- dialogue: 대화를 말한 순서대로 정리. 화자 이름을 모르면 "화자1","화자2"로. 군더더기(음, 어, 반복)는 빼고 뜻은 그대로. 각 항목 {s:화자, t:내용}
- points: 주요 안건·전달사항 목록
- decisions: 결정된 사항 목록 (없으면 빈 배열)
- todos: 할 일 목록 {who:담당(모르면 ""), what:할 일, when:기한(모르면 "")}
- safety: 안전 관련 당부·위험 요소 (없으면 빈 배열)
규칙: 녹음에 없는 내용은 절대 지어내지 마. 들리지 않는 부분은 "(잘 안 들림)"으로 표시해.
개인 전화번호·주민번호 같은 개인정보가 들리면 "(개인정보 생략)"으로 바꿔 적어.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' }, summary: { type: 'STRING' },
    dialogue: { type: 'ARRAY', items: { type: 'OBJECT', properties: { s: { type: 'STRING' }, t: { type: 'STRING' } }, required: ['s', 't'] } },
    points: { type: 'ARRAY', items: { type: 'STRING' } },
    decisions: { type: 'ARRAY', items: { type: 'STRING' } },
    todos: { type: 'ARRAY', items: { type: 'OBJECT', properties: { who: { type: 'STRING' }, what: { type: 'STRING' }, when: { type: 'STRING' } }, required: ['what'] } },
    safety: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['title', 'summary', 'dialogue', 'points', 'decisions', 'todos', 'safety']
};

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const okOrigin = ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Lang',
      'Access-Control-Max-Age': '86400', 'Vary': 'Origin'
    };
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'GET') return out({ ok: true, name: '안전 허브 녹음 정리 서버', key: !!env.GEMINI_KEY });
    if (req.method !== 'POST') return out({ error: '지원하지 않는 요청이에요.' }, 405);
    if (!okOrigin) return out({ error: '허용되지 않은 주소에서 온 요청이에요.' }, 403);
    if (!env.GEMINI_KEY) return out({ error: '서버에 Gemini 키(GEMINI_KEY)가 아직 등록되지 않았어요.' }, 500);

    // 1) 지사 앱 로그인 확인
    const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    let user;
    try { user = await verifyFirebase(tok); } catch (e) { return out({ error: '로그인 확인에 실패했어요. 앱을 다시 열어 주세요.' }, 401); }

    // 2) 녹음 받기
    const type = (req.headers.get('Content-Type') || 'audio/webm').split(';')[0].trim();
    if (!type.startsWith('audio/') && type !== 'video/mp4' && type !== 'video/webm') return out({ error: '녹음 파일 형식이 아니에요.' }, 415);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return out({ error: '녹음이 비어 있어요.' }, 400);
    if (buf.byteLength > MAX_BYTES) return out({ error: '녹음이 너무 길어요. 60분 이내로 나눠서 녹음해 주세요.' }, 413);
    const mime = type === 'video/mp4' ? 'audio/mp4' : type === 'video/webm' ? 'audio/webm' : type;

    // 3) Gemini 로 정리
    const body = {
      contents: [{ role: 'user', parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: b64(buf) } }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: SCHEMA }
    };
    let last = '';
    for (const m of (env.MODEL ? [env.MODEL, ...MODELS] : MODELS)) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY }, body: JSON.stringify(body)
      });
      if (r.status === 404) { last = `모델 ${m} 없음`; continue; }        // 이름이 바뀐 모델은 건너뜀
      const j = await r.json().catch(() => ({}));
      if (r.status === 429) return out({ error: '오늘 무료 사용량을 다 썼어요. 내일 다시 시도해 주세요.', code: 'quota' }, 429);
      if (!r.ok) { last = (j.error && j.error.message) || ('HTTP ' + r.status); if (r.status >= 500) continue; return out({ error: 'AI 정리에 실패했어요: ' + last }, 502); }
      const txt = (((j.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text || '').join('') || '';
      let data; try { data = JSON.parse(txt); } catch (e) { return out({ error: 'AI 응답을 읽지 못했어요. 다시 시도해 주세요.' }, 502); }
      return out({ ok: true, model: m, by: user.email || '', at: Date.now(), ...data });
    }
    return out({ error: 'AI 정리에 실패했어요: ' + last }, 502);
  }
};

/* ArrayBuffer → base64 (큰 파일도 안전하게 조각으로) */
function b64(buf) {
  const u = new Uint8Array(buf); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}

/* Firebase 로그인 토큰(구글 서명) 검증 */
let JWKS = null, JWKS_AT = 0;
async function verifyFirebase(tok) {
  const [h, p, sig] = (tok || '').split('.');
  if (!sig) throw new Error('no token');
  const dec = s => JSON.parse(new TextDecoder().decode(ub64(s)));
  const head = dec(h), pay = dec(p), now = Date.now() / 1000;
  if (head.alg !== 'RS256') throw new Error('alg');
  if (pay.aud !== PROJECT || pay.iss !== 'https://securetoken.google.com/' + PROJECT) throw new Error('aud');
  if (!(pay.exp > now) || !(pay.iat < now + 300) || !pay.sub) throw new Error('exp');
  if (!JWKS || Date.now() - JWKS_AT > 3600e3) {
    JWKS = (await (await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')).json()).keys; JWKS_AT = Date.now();
  }
  const jwk = JWKS.find(k => k.kid === head.kid);
  if (!jwk) throw new Error('kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, ub64(sig), new TextEncoder().encode(h + '.' + p));
  if (!ok) throw new Error('sig');
  return pay;
}
function ub64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
