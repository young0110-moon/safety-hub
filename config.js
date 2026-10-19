/* ===== 부산동부지사 안전 허브 · 서버 설정 =====
   Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 웹앱 SDK 설정값. 공개돼도 괜찮아요(실제 보안은 firestore.rules와 입장 코드).
   ADMIN_EMAILS: 관리자(공지 삭제·멤버 관리) 구글 이메일. Firestore settings/access 의 admins 와 같게 유지하세요. */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBkU4chE7dRRDGc4Aq7uMIkYnJcEwiu8GQ",
  authDomain: "moon0110-50b6f.firebaseapp.com",
  projectId: "moon0110-50b6f",
  storageBucket: "moon0110-50b6f.firebasestorage.app",
  messagingSenderId: "750333420594",
  appId: "1:750333420594:web:28091734f3d720ad9b882b"
};
window.ADMIN_EMAILS = ["glare0110@gmail.com"];

/* 브리핑 녹음 AI 정리 서버 (Cloudflare Workers) 주소. 비어 있으면 '준비 중'으로 표시됩니다.
   Gemini 키는 여기에 넣지 마세요! (Cloudflare 의 비밀 변수 GEMINI_KEY 에만) */
window.AI_URL = "https://koelsa-ai.glare0110.workers.dev";

/* 푸시 알림: Firebase 콘솔 → 프로젝트 설정 → 클라우드 메시징 → 웹 푸시 인증서의 '키 쌍'(공개키, 공개돼도 괜찮음) */
window.FCM_VAPID = "";
