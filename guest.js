/* MOA 게스트(체험) 모드: 진짜 서버(Firebase)에 연결하지 않고, 예시 데이터로만 화면을 보여 줌.
   - 로그인·입장 코드 없이 열림
   - 무엇을 눌러도 이 브라우저 메모리에만 잠깐 남고, 새로고침하면 사라짐 (지사 데이터에 영향 없음)
   - AI 기능(녹음 정리·기준 AI)은 꺼 둠
   guest.html 은 배포할 때 index.html 에서 자동으로 만들어짐 (.github/workflows/pages.yml) */
(function(){
const S={},subs=[],clone=o=>o===undefined?undefined:JSON.parse(JSON.stringify(o));
const FV={increment:n=>({__inc:n}),arrayUnion:(...a)=>({__au:a}),arrayRemove:(...a)=>({__ar:a}),serverTimestamp:()=>Date.now(),delete:()=>({__del:1})};
function apply(old,d){const o=clone(old)||{};for(const[k,v]of Object.entries(d)){if(v&&v.__del){delete o[k]}else if(v&&v.__inc!==undefined)o[k]=(o[k]||0)+v.__inc;else if(v&&v.__au)o[k]=[...new Set([...(o[k]||[]),...v.__au])];else if(v&&v.__ar)o[k]=(o[k]||[]).filter(x=>!v.__ar.includes(x));else o[k]=clone(v)}return o}
function snapCol(col){const docs=Object.keys(S).filter(k=>k.split('/')[0]===col).map(k=>{const id=k.split('/')[1];return{id,exists:true,data:()=>clone(S[k])}});docs.sort((a,b)=>(b.data().at||0)-(a.data().at||0));return{docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f),docChanges:()=>[]}}
const notify=col=>setTimeout(()=>subs.filter(s=>s.col===col).forEach(s=>s.f()),0);
function docRef(path){const[col,id]=path.split('/');return{id,path,
  get:async()=>{if(path==='settings/access')throw{code:'permission-denied',message:'guest'};return{id,exists:!!S[path],data:()=>clone(S[path])}},  /* 게스트는 관리자 아님 */
  set:async(d,o)=>{S[path]=o&&o.merge?apply(S[path],d):apply({},d);notify(col)},
  update:async d=>{S[path]=apply(S[path],d);notify(col)},
  delete:async()=>{delete S[path];notify(col)},
  collection:sub=>colRef(path+'/'+sub),
  onSnapshot:(cb)=>{const f=()=>cb({id,exists:!!S[path],data:()=>clone(S[path])});subs.push({col,f});setTimeout(f,0);return()=>{}}}}
function colRef(col){const q={orderBy:()=>q,limit:()=>q,where:()=>q,startAfter:()=>q,
  onSnapshot:(cb)=>{const f=()=>cb(snapCol(col));subs.push({col,f});setTimeout(f,0);return()=>{}},
  get:async()=>snapCol(col),add:async d=>{const id='g'+Math.random().toString(36).slice(2,10);await docRef(col+'/'+id).set(d);return{id}},
  doc:id=>docRef(col+'/'+(id||'g'+Math.random().toString(36).slice(2,10)))};return q}
const fs={collection:colRef,doc:docRef,enablePersistence:()=>Promise.resolve(),batch:()=>{const ops=[];return{set:(r,d,o)=>ops.push(()=>r.set(d,o)),update:(r,d)=>ops.push(()=>r.update(d)),delete:r=>ops.push(()=>r.delete()),commit:async()=>{for(const f of ops)await f()}}}};
const user={uid:'guest',email:'guest@moa.demo',displayName:'체험',getIdToken:async()=>'guest'};
const auth={currentUser:user,setPersistence:async()=>{},getRedirectResult:async()=>null,onAuthStateChanged:cb=>{setTimeout(()=>cb(user),0);return()=>{}},signOut:async()=>{location.reload()},signInWithPopup:async()=>{},signInWithRedirect:async()=>{}};
const firestore=()=>fs;firestore.FieldValue=FV;
const authF=()=>auth;authF.Auth={Persistence:{LOCAL:1,SESSION:1,NONE:1}};authF.GoogleAuthProvider=function(){this.setCustomParameters=()=>{};this.addScope=()=>{}};
window.firebase={apps:[1],initializeApp:()=>{},auth:authF,firestore,messaging:()=>({getToken:async()=>'',onMessage:()=>{}})};
window.MOA_GUEST=true;

/* 예시 데이터 (모두 지어낸 이름·번호) */
const now=Date.now(),H=36e5,D=864e5,day=n=>{const d=new Date(now+n*D);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const M=(id,name,rank,team,tel,seen)=>S['members/'+id]={name,rank,team,tel,status:'active',at:now-30*D,seen};
M('guest','체험','사원','게스트','010-0000-0000',now);
M('g1','홍길동','팀장','검사1팀','010-1111-2222',now-2*60e3);
M('g2','김모아','과장','검사1팀','010-3333-4444',now-3*H);
M('g3','이안전','대리','검사2팀','010-5555-6666',now-D);
M('g4','박승강','주임','검사2팀','010-7777-8888',now-5*60e3);
S['settings/main']={};
S['notices/n1']={title:'[예시] 12월 안전보건교육 안내',body:'체험용 예시 공지입니다. 실제 공지가 아닙니다.',level:'normal',at:now-2*H,created:now-2*H,by:'g1',evDate:day(3),evTime:'14:00',ev:'e1'};
S['events/e1']={date:day(3),title:'[예시] 12월 안전보건교육',time:'14:00',cat:'공지',by:'g1',at:now-2*H};
S['events/e2']={date:day(7),title:'[예시] 지사 워크숍',time:'',cat:'일정',by:'g2',at:now-5*H};
S['voices/v1']={text:'[예시] ○○아파트 승강장 문 닫힘 소음 있음. 점검 시 참고 바랍니다.',cat:'현장공유',place:'예시 아파트',photos:[],urgent:false,by:'g4',at:now-40*60e3};
S['voices/v2']={text:'[예시] 오늘 오후 비 예보 있습니다. 옥외 에스컬레이터 검사 시 미끄럼 주의!',cat:'현장공유',place:'',photos:[],urgent:false,by:'g3',at:now-4*H};
S['talks/t1']={cat:'💡 꿀팁 공유',title:'[예시] 브레이크 시험 기록 빨리 남기는 법',text:'체험용 예시 글입니다.',photos:0,tag:'익명1',kh:'0'.repeat(64),likes:3,at:now-6*H};
S['talks/t2']={cat:'🙋 궁금해요',title:'[예시] 정밀안전검사 대상 기준이 궁금해요',text:'체험용 예시 글입니다.',photos:0,tag:'익명2',kh:'0'.repeat(64),likes:1,at:now-D};

/* AI 서버·푸시 서버 호출은 막고 안내만 */
const of=window.fetch.bind(window);
window.fetch=(u,o)=>{const s=String(u&&u.url||u);if(/workers\.dev|googleapis\.com|fcm/i.test(s))return Promise.resolve(new Response(JSON.stringify({ok:false,error:'게스트 체험 화면에서는 AI·알림 기능을 쓸 수 없어요.'}),{status:403,headers:{'Content-Type':'application/json'}}));return of(u,o)};

/* 화면 위쪽 안내 띠 */
function banner(){if(document.getElementById('guestBar'))return;
  const st=document.createElement('style');st.textContent='[id^=perm]{display:none!important}';document.head.appendChild(st);  /* 권한 요청 창 숨김 */
  const b=document.createElement('div');b.id='guestBar';
  b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 76px);z-index:400;background:rgba(30,27,75,.92);color:#fff;font:700 12px/1.4 sans-serif;padding:8px 14px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.25);white-space:nowrap;pointer-events:none';
  b.textContent='👀 게스트 체험 화면 · 예시 데이터 · 저장되지 않아요';document.body.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner);else banner();
/* 게스트는 알림·위치 권한 창을 띄우지 않음 */
try{if(window.Notification)Object.defineProperty(Notification,'permission',{get:()=>'denied'})}catch(e){}
})();
