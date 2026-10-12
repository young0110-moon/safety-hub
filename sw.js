/* 오프라인·빠른 실행용 캐시. 앱 파일과 연혁집 데이터는 캐시, 서버(Firebase)·날씨는 항상 네트워크. */
const VER='hub-v4';
const SHELL=['./','./index.html','./config.js','./tailwind.css','./vendor/firebase-app-compat.js','./vendor/firebase-auth-compat.js','./vendor/firebase-firestore-compat.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.includes('/data/')){ // 연혁집: 캐시 우선, 없으면 받아서 저장
    e.respondWith(caches.open(VER).then(async c=>{const h=await c.match(e.request);if(h)return h;const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}));return;
  }
  // 앱 파일: 네트워크 우선(새 버전 반영), 실패 시 캐시
  e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(VER).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>caches.match(e.request)));
});
