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
