# ON-DO 백엔드 연결 지점

현재는 `js/api.js`의 `USE_MOCK = true`와 `js/mock-data.js`로 화면 상태를 시연합니다.

| 기능 | 함수 | 전환 예정 엔드포인트 | 현재 mock |
|---|---|---|---|
| 통합섬 목록 | `getIslandPosts()` | `GET /api/v1/islands/8/posts` | `ondo-common-v1` + 시드 |
| 고민 등록 | `createPost()` | `POST /api/v1/posts` | localStorage 저장 |
| 유사 고민 검색 | `searchSimilar()` | `POST /api/v1/islands/8/search` | 제목·본문 포함 검색 |

`USE_MOCK`을 `false`로 바꾸고 `BASE_URL`의 fetch 래퍼를 연결하면 화면 코드 변경 없이 전환할 수 있습니다.
