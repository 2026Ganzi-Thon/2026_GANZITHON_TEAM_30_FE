# ON-DO

직무별 섬에서 익명으로 고민을 나누는 웹 데모입니다.

## 실행

1. ZIP의 압축을 풀고 VS Code에서 **파일 → 폴더 열기**로 `ON-DO` 폴더를 엽니다.
2. `index.html`을 브라우저에서 엽니다. VS Code의 Live Server를 사용하는 경우 `index.html`을 우클릭하고 **Open with Live Server**를 선택하세요.
3. **WELCOME TO ON-DO**를 누르고 체험용 이메일 인증, 직무·연차 선택, 캐릭터·닉네임 설정을 거쳐 **직무섬 입장**을 누릅니다.

별도 패키지 설치나 빌드가 필요 없습니다. 팀 저장소에는 이 폴더 안의 파일과 하위 폴더를 함께 올리세요.

## 파일 구성

| 경로 | 역할 |
| --- | --- |
| `index.html` | 시작 화면 및 온보딩 |
| `village.html` | 직무섬 화면 |
| `css/style.css`, `css/village.css` | 화면별 스타일 |
| `js/app.js` | 온보딩과 캐릭터·닉네임 설정 |
| `js/village.js` | 지도, 검색, 글·답글, 프로필 |
| `js/review.js` | 게시 전 점검 규칙 |
| `assets/characters/`, `assets/jobs/` | 캐릭터 및 직무 아이콘 |
| `assets/welcome/`, `assets/village/`, `assets/themes/` | 시작 화면 이미지, 지도 배경, 시간대 아이콘 |

이메일 인증은 실제 메일을 발송하지 않는 데모입니다. 게시 전 점검은 브라우저 규칙으로 동작하며 외부 AI를 호출하지 않습니다. 프로필과 작성한 글·답글은 현재 브라우저에 저장되며 팀원 간에 동기화되지 않습니다.
