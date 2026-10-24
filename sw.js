/* 오프라인·빠른 실행용 캐시. 앱 파일과 연혁집 데이터는 캐시, 서버(Firebase)·날씨는 항상 네트워크. */
const VER='hub-v9';
const SHELL=['./','./index.html','./config.js','./tailwind.css','./vendor/firebase-app-compat.js','./vendor/firebase-auth-compat.js','./vendor/firebase-firestore-compat.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./eli.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(SHELL.map(x=>new Request(x,{cache:'no-store'})))).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.includes('/data/')){ // 연혁집: 캐시 우선, 없으면 받아서 저장
    e.respondWith(caches.open(VER).then(async c=>{const h=await c.match(e.request);if(h)return h;const r=await fetch(e.request,{cache:'no-cache'});if(r.ok)c.put(e.request,r.clone());return r}));return;
  }
  // 앱 파일: 네트워크 우선(브라우저 HTTP 캐시도 건너뜀 → 항상 최신), 실패 시 캐시
  const nav=e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/')||u.pathname.endsWith('/version.json')||u.pathname.endsWith('/config.js')||u.pathname.endsWith('/tailwind.css')||u.pathname.endsWith('.webmanifest')||/\/(icon-[\w-]+|apple-touch-icon)\.png$/.test(u.pathname);
  const req=nav?new Request(e.request.url,{cache:'no-store',credentials:'same-origin'}):e.request;
  e.respondWith(fetch(req).then(r=>{if(r.ok&&!u.pathname.endsWith('/version.json'))caches.open(VER).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});

/* ===== 🔔 푸시 알림: 서버가 보낸 데이터(title·body·url)로 잠금 화면 알림 표시 ===== */
self.addEventListener('push',e=>{
  let d={};try{const j=e.data?e.data.json():{};d=j.data||j.notification||j}catch(err){d={title:'MOA',body:e.data?e.data.text():''}}
  const title=d.title||'MOA · 부산동부지사',sos=d.kind==='sos';
  e.waitUntil(self.registration.showNotification(title,{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:d.kind==='brief'?'brief':'hub-'+(d.at||Date.now()),renotify:true,requireInteraction:sos,vibrate:sos?[400,150,400,150,400]:[150],data:{url:d.url||'#home'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();const url=new URL(self.registration.scope).href+((e.notification.data&&e.notification.data.url)||'#home');
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){if(c.url.startsWith(self.registration.scope)){c.focus();return c.navigate?c.navigate(url):null}}
    return self.clients.openWindow(url)}));
});
