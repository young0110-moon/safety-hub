/* ===== 부산동부지사 안전 허브 · 서버 설정 =====
   1) Firebase 콘솔 → 프로젝트 설정 → "내 앱" → 웹앱(</>) → SDK 설정에서 firebaseConfig 값을 아래에 붙여 넣으세요.
   2) ADMIN_EMAILS 에 관리자(공지 삭제·멤버 관리 가능) 구글 이메일을 적으세요.
   이 파일은 공개돼도 괜찮아요. 실제 보안은 Firestore 규칙(firestore.rules)과 입장 코드가 담당해요. */
window.FIREBASE_CONFIG = {
  apiKey: "붙여넣기",
  authDomain: "붙여넣기.firebaseapp.com",
  projectId: "붙여넣기",
  storageBucket: "붙여넣기.appspot.com",
  messagingSenderId: "붙여넣기",
  appId: "붙여넣기"
};
window.ADMIN_EMAILS = ["glare0110@gmail.com"];
