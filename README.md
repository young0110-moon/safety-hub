# 부산동부지사 안전 허브 · 웹앱 설치 안내

휴대폰 홈 화면에 설치되는 웹앱(PWA)입니다. 직원 공용 데이터는 Firebase(구글)에 저장되고, 앱 파일은 GitHub Pages에 올립니다. 둘 다 무료 범위로 충분합니다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 앱 본체 (화면·기능 전부) |
| `config.js` | **Firebase 설정값 + 관리자 이메일** ← 직접 채워야 함 |
| `firestore.rules` | 서버 보안 규칙 (Firebase 콘솔에 붙여 넣음) |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | 홈 화면 설치·오프라인용 |
| `data/elv.json`, `esc.json`, `std.json` | 엘리베이터·에스컬레이터 연혁집, 표준화자료 |
| `data/fig/*.webp` | 원문 그림 121장 |

## 1단계 · Firebase 만들기 (약 10분)

1. https://console.firebase.google.com 접속 → **프로젝트 추가** → 이름 `busan-east-hub` (아무거나) → 애널리틱스는 꺼도 됨.
2. 왼쪽 **빌드 → Authentication → 시작하기 → 로그인 방법 → Google → 사용 설정** → 프로젝트 공개용 이름·지원 이메일 입력 → 저장.
3. **빌드 → Firestore Database → 데이터베이스 만들기** → 위치 `asia-northeast3 (서울)` → **프로덕션 모드**로 시작.
4. Firestore **규칙** 탭 → 내용을 모두 지우고 `firestore.rules` 파일 내용을 붙여 넣기 → **게시**.
5. Firestore **데이터** 탭 → **컬렉션 시작** → 컬렉션 ID `settings` → 문서 ID `access` → 필드 추가:
   - `code` (string) : 직원에게 알려줄 **입장 코드** (예: `6자리 숫자`)
   - `admins` (array) : 관리자 구글 이메일 (예: `glare0110@gmail.com`)
   → 저장. 이 문서는 앱에서 읽을 수 없고 규칙 안에서만 쓰입니다.
6. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → `</>` 웹 앱 추가** → 닉네임 입력 → 등록 → 화면에 나오는 `firebaseConfig { ... }` 값을 **`config.js`에 그대로 붙여 넣기**. `ADMIN_EMAILS`에도 관리자 이메일을 적습니다.
7. **Authentication → 설정 → 승인된 도메인 → 도메인 추가** → 2단계에서 만들 주소 `아이디.github.io` 추가. (이걸 빼먹으면 구글 로그인이 안 됩니다.)

## 2단계 · GitHub Pages에 올리기

**방법 A (추천)** — claude.ai 설정 → 연결 → GitHub 연결 후, Claude에게 "웹앱 GitHub에 올려줘"라고 하면 저장소 생성·업로드·Pages 설정까지 대신 합니다.

**방법 B (직접)**
1. https://github.com 가입 → **New repository** → 이름 `safety-hub` → Public → Create.
2. **Add file → Upload files** → 이 폴더의 파일을 끌어다 놓기 (`data/fig`는 파일이 121개라 두 번에 나눠 올리면 됩니다) → Commit.
3. 저장소 **Settings → Pages → Branch: main / (root) → Save**. 1~2분 뒤 `https://아이디.github.io/safety-hub/` 주소가 생깁니다.
4. 이 주소의 도메인(`아이디.github.io`)을 Firebase 승인된 도메인에 추가했는지 확인.

> 저장소는 공개(Public)라 앱 화면 코드는 누구나 볼 수 있지만, 직원 글·일정·사진은 Firebase에만 있고 입장 코드와 로그인 없이는 읽을 수 없습니다.

## 3단계 · 직원 안내

1. 주소를 단톡방에 공유.
2. 휴대폰에서 열기 → **구글 계정으로 로그인** → 이름·직급·팀·**입장 코드** 입력 → 입장.
3. 홈 화면 추가: 아이폰은 사파리 공유 → "홈 화면에 추가", 안드로이드는 크롬 메뉴 → "앱 설치".
4. SOS를 처음 누르면 "위치 허용" 창이 뜹니다. **허용**을 눌러야 상황실에 위치 문자를 보낼 수 있습니다.

## 운영 팁

- **입장 코드 바꾸기**: Firestore → settings/access → code 값 수정. 이미 가입한 직원은 영향 없음.
- **직원 내보내기**: Firestore → members → 해당 문서 삭제. 다시 들어오려면 입장 코드가 필요합니다.
- **상황실 번호**: 앱 SOS 화면의 ✏️ 버튼으로 수정 (지사 전체 적용).
- **앱 수정**: `index.html`을 바꿔 다시 올리면 직원 폰은 다음 실행 때 새 버전을 받습니다.
- **날씨**: Open-Meteo(무료)에서 해운대 기준으로 자동. 기상특보는 기상청 앱 확인.
- **연혁집 자료 갱신**: `data/*.json`을 교체하고 `sw.js`의 `VER` 값을 `hub-v2`처럼 올리면 직원 폰 캐시가 새로 받아집니다.

## 아티팩트(현재 Claude 앱)와 다른 점

| 항목 | 아티팩트 | 웹앱 |
|---|---|---|
| 위치(GPS) | 불가 | SOS·현장목소리·병원 찾기에서 사용 |
| SOS | 지사 알림만 | 지사 알림 + 현재 주소·지도 링크를 상황실에 문자 |
| 로그인 | Claude 계정 | 구글 계정 + 입장 코드 |
| 홈 화면 설치 | 불가 | 가능(앱처럼 실행, 오프라인 연혁집) |
| AI 요약(모닝브리핑) | Claude 요약 | 간단 규칙 요약 |
| 날씨 | 매일 아침 예약 갱신 | 접속할 때 자동 |
