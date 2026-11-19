const el = (id) => document.getElementById(id);
const me = loadProfile();
if (!me || !authToken())
  location.replace("index.html");

const escapeText = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const img = (index) =>
  Number.isInteger(index) && index >= 0 && index < 13
    ? "assets/characters/" + index + ".png"
    : "assets/characters/0.png";
const characterNames = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지", "사자"];
const ways = ["들어주세요", "경험을 나눠주세요", "함께 생각해주세요"];
const topics = {
  "업무·직장생활": [
    "업무량·스트레스",
    "직장 내 관계·갈등",
    "업무 실수",
    "성과 압박",
    "조직 문화",
    "워라밸",
    "직장 내 괴롭힘",
  ],
  "진로·성장": [
    "진로·직무 적성",
    "이직·퇴사",
    "커리어 성장·역량",
    "취업·입사 적응",
    "미래 불안",
  ],
  "감정·마음": [
    "번아웃·무기력",
    "불안·걱정",
    "외로움·고립감",
    "자존감·비교",
    "감정 조절",
  ],
  "관계·일상": [
    "인간관계·갈등",
    "연애·이별",
    "가족·결혼",
    "경제·금전",
    "건강·생활습관",
  ],
};
const config = window.ISLAND_CONFIG;
const key = config.storageKey;
const state = JSON.parse(
  localStorage.getItem(key) ||
    '{"posts":[],"replies":{},"theme":"day","read":[]}',
);
state.player ??= { x: 46, y: 62 };
const samples = [
  [
    "느린곰",
    0,
    "피드백을 받을 때마다 제가 부족한 사람 같아요",
    "상사에게 피드백을 받으면 자꾸 자신감이 떨어져요. 다음 일을 시작하기도 전에 걱정부터 앞서요.",
    0,
    "업무량·스트레스",
    "2년차",
    51,
    44,
    [],
  ],
  [
    "작은사슴",
    1,
    "회의에서 제 의견을 꺼내기가 어려워요",
    "회의 중에 하고 싶은 말이 있어도 타이밍을 놓쳐요. 다른 분들은 처음에 어떻게 의견을 꺼내셨는지 궁금해요.",
    1,
    "직장 내 관계·갈등",
    "1년차",
    41,
    50,
    [
      ["조용한 토끼", "저는 회의 전에 한 문장만 미리 적어두니 조금 편했어요."],
      ["포근한 양", "저도 비슷했어요. 먼저 질문으로 말을 시작해 봤어요."],
    ],
  ],
  [
    "밤산책",
    3,
    "퇴근해도 업무 생각이 멈추지 않아요",
    "집에 돌아와도 할 일이 계속 떠올라서 쉬는 시간이 짧게 느껴져요.",
    2,
    "워라밸",
    "3년차",
    58,
    49,
    [["다정한 용", "퇴근 전에 내일 할 일을 적어두는 게 도움이 됐어요."]],
  ],
  [
    "도토리",
    8,
    "첫 프로젝트를 끝냈는데 마음이 허전해요",
    "한동안 한 가지 일에 몰입했는데 마무리하고 나니 다음에 뭘 해야 좋을지 모르겠어요.",
    0,
    "커리어 성장·역량",
    "1년차",
    45,
    64,
    [],
  ],
].map(([nick, animal, title, body, way, topic, years, x, y, replies], i) => ({
  id: "sample-" + i,
  nick,
  animal,
  title,
  body,
  way,
  topic,
  years,
  x,
  y,
  replies,
  job: me?.job,
  time: ["방금", "5분 전", "12분 전", "18분 전"][i],
}));
const notices = [
  {
    id: "example-1",
    title: "팀 회의에서 말하기가 어려워요",
    time: "방금 전",
    name: "느린곰",
    body: "저도 비슷했어요. 다음 회의에 할 말을 한 문장만 적어두면 부담이 조금 줄더라고요.",
  },
  {
    id: "example-2",
    title: "퇴근 후에도 일이 생각나요",
    time: "1시간 전",
    name: "밤산책",
    body: "퇴근 전에 내일 할 일을 적어두니 조금 편해졌어요.",
  },
];
const themes = [
  ["night", "밤"],
  ["dawn", "새벽"],
  ["day", "낮"],
  ["sunset", "노을"],
];
const jobNames = {
  디자인: "Design village",
  개발: "Development village",
  마케팅: "Marketing village",
};
const save = () => localStorage.setItem(key, JSON.stringify(state));
const own = () => state.posts.filter((p) => p.job === me.job);
const repliesFor = (p) => [
  ...(p.replies || []),
  ...(state.replies[p.id] || []),
];
const find = (id) => [...own(), ...samples].find((p) => p.id === id);
const opt = (text, value = text) => new Option(text, value);
let comfortFilter = "";
let waitingOnly = false; // "답을 기다리는 고민"만 보기
const activeFilters = () => searchText || comfortFilter || waitingOnly;
const tokenise = (text) => text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
let selectedTopic = "";
let zoom = 1,
  visiblePins = [],
  recentWorryIds = new Set();
let searchText = "",
  tab = "alerts",
  editing = null,
  deleting = null,
  toastTimer;
let themeSwapTimer, themeTransitionTimer;

function toast(message) {
  el("notice").textContent = message;
  el("notice").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el("notice").hidden = true;
  }, 2400);
}
// 시간대별 배경: 일출 5시, 낮 6~17시, 노을 18~19시, 밤 20시~새벽 4시
function themeForHour(hour = new Date().getHours()) {
  if (hour === 5) return "dawn";
  if (hour >= 6 && hour < 18) return "day";
  if (hour >= 18 && hour < 20) return "sunset";
  return "night";
}
// 자동 모드(기본)면 지금 시각에 맞는 배경으로 바꿈
function syncThemeWithClock() {
  if (state.themeMode === "manual") return;
  changeTheme(themeForHour());
}
function changeTheme(nextTheme) {
  if (nextTheme === state.theme) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    state.theme = nextTheme;
    save();
    renderTheme();
    return;
  }

  const map = el("map");
  const nextImage = new Image();
  nextImage.src = `assets/village/village-${nextTheme}.webp`;
  clearTimeout(themeSwapTimer);
  clearTimeout(themeTransitionTimer);
  map.classList.remove("theme-transitioning");
  void map.offsetWidth;
  map.classList.add("theme-transitioning");

  themeSwapTimer = setTimeout(() => {
    state.theme = nextTheme;
    save();
    renderTheme();
  }, 360);
  themeTransitionTimer = setTimeout(() => {
    map.classList.remove("theme-transitioning");
  }, 900);
}
function renderTheme() {
  const [, name] = themes.find(([id]) => id === state.theme) ?? themes[2];
  const current = el("currentTheme");
  current.setAttribute("aria-label", "배경 시간대 선택 · 현재 " + name);
  current.title = name + " 배경";
  current.innerHTML = `<img src="assets/themes/theme-${state.theme}.png" alt="">`;
  el("land").src = "assets/village/village-" + state.theme + ".webp";
  el("map").dataset.time = state.theme; // 시간대별 빛·반딧불이 등 분위기 연출
  const auto = state.themeMode !== "manual";
  el("themes").innerHTML =
    themes
      .map(
        ([id, name]) =>
          `<button type="button" data-theme="${id}" aria-label="${name}" title="${name}" aria-pressed="${!auto && id === state.theme}"><img src="assets/themes/theme-${id}.png" alt=""></button>`,
      )
      .join("") +
    `<button type="button" class="theme-auto" data-theme-auto aria-label="시간에 맞춰 자동" title="시간에 맞춰 자동" aria-pressed="${auto}">자동</button>`;
}

let feedRequestId = 0;

async function renderFeed() {
  const requestId = ++feedRequestId;
  loadTemperature();
  const query = searchText.trim();

  el("reset").hidden = !activeFilters();

  if (query && (query.length < 2 || query.length > 200)) {
    el("count").textContent = "검색어를 확인해주세요.";
    el("feed").textContent = "검색어는 2~200자로 입력해주세요.";
    return;
  }

  el("count").textContent = "고민을 불러오는 중...";
  el("feed").textContent = "잠시만 기다려주세요.";

  try {
    if (!Number.isInteger(islandId) || islandId <= 0) {
      throw new Error("섬 선택 화면에서 다시 입장해주세요.");
    }

    let posts;
    let fallback = null;
    let hasMore = false;

    if (query) {
      const params = new URLSearchParams({
        q: query,
        island_id: String(islandId),
        limit: "20"
      });

      const result = await api(`/search?${params}`);
      posts = result.items;
      fallback = result.empty ? result.fallback : null;
    } else {
      const params = new URLSearchParams({ limit: "50" });

      if (waitingOnly) params.set("waiting", "true");

      if (comfortFilter !== "") {
        params.set(
          "comfort_type",
          COMFORT_KEYS[Number(comfortFilter)]
        );
      }

      const result = await api(`/islands/${islandId}/posts?${params}`);
      posts = result.posts;
      hasMore = Boolean(result.next_before_id);
    }

    if (requestId !== feedRequestId) return;

    // 유사 검색 결과에도 선택한 위로 방식 적용
    if (query && comfortFilter !== "") {
      posts = posts.filter(
        post => post.comfort_type === COMFORT_KEYS[Number(comfortFilter)]
      );
    }

    if (query && waitingOnly) posts = posts.filter(post => post.waiting);

    recentWorryIds = new Set(posts.slice(0, 3).map(post => post.id));

    el("count").textContent =
      (query ? "비슷한 고민 " : activeFilters()
        ? "조건에 맞는 고민 "
        : "최근 올라온 고민 ") +
      posts.length + (hasMore ? "+" : "");

    if (fallback) {
      el("feed").innerHTML = `
        <p>${escapeText(fallback.message)}</p>
        <div id="fallbackKeywords" class="row"></div>
        <button type="button" id="writeFromSearch">
          이 내용으로 고민 쓰기
        </button>
      `;

      for (const keyword of fallback.keywords || []) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "soft";
        button.textContent = keyword.label;
        button.onclick = () => {
          searchText = el("query").value = keyword.query;
          renderFeed();
        };
        el("fallbackKeywords").append(button);
      }

      el("writeFromSearch").onclick = () => {
        editor();
        el("body").value = fallback.write_prefill?.content || query;
        updateDraftCounts();
      };

      return;
    }

    el("feed").innerHTML = posts.map(post => {
      const way = COMFORT_KEYS.indexOf(post.comfort_type);

      return `
        <button class="card" data-post="${post.id}">
          <small class="mode">
            ${escapeText(ways[way] || "")} ·
            ${escapeText(new Date(post.created_at).toLocaleString("ko-KR"))}
          </small>
          <strong>${escapeText(post.title)}${post.waiting ? '<span class="waiting-badge">답을 기다려요</span>' : ""}</strong>
          <small>${escapeText(post.author?.nickname || "떠난 이용자")}</small>
          <small>
            ${escapeText(post.topic)} · 답글 ${post.comment_count}
          </small>
        </button>
      `;
    }).join("") || (
      activeFilters()
        ? "<p>조건에 맞는 고민이 없어요.</p>"
        : "<p>아직 올라온 고민이 없어요.</p>"
    );
  } catch (error) {
    if (requestId !== feedRequestId) return;

    el("count").textContent = "고민을 불러오지 못했어요.";
    el("feed").textContent = error.message;
  }
}

// ───────── 지도: 이웃 배치 · 실시간 접속 · 공명 · 모닥불 · 방향키 ─────────
const clusterPoint = { x: 31, y: 57 };
const revealZoom = 0; // 이웃을 숫자로 묶지 않고 항상 각자 자리에 보여 줌
const campfirePoint = { x: 50, y: 44 }; // 섬 중앙 광장
// 강·호수·집을 피한 풀밭 자리(%). 글 위치가 없는 이웃은 이 중 한 곳에 선다
const SPOTS = [
  [12, 27], [25, 25], [36, 20], [40, 29], [55, 25], [63, 29], [45, 8], [55, 10],
  [30, 32], [12, 45], [28, 50], [35, 44], [40, 56], [45, 62], [56, 55], [66, 48],
  [82, 38], [86, 50], [78, 58], [85, 66], [75, 68], [60, 80], [45, 86], [30, 60],
  [22, 75], [40, 82], [65, 88], [8, 58], [80, 24], [88, 76],
];
const islandId = Number(
  new URLSearchParams(location.search).get('island_id')
);

let serverNeighbors = [];
let onlineNeighbors = new Map(); // user_id → { author, x, y } 지금 접속 중인 이웃
let resonance = new Map(); // user_id → similarity 내 고민과 공명하는 이웃
let presenceEnabled = true;
let islandTemp = null;

const shortTitle = (title, max = 14) =>
  title.length > max ? title.slice(0, max) + "…" : title;
const clampPos = (value, min, max) => Math.max(min, Math.min(max, value));

// 글 위치가 없을 때 쓰는 자리: 같은 사람은 항상 같은 자리
function spotFor(userId) {
  const [x, y] = SPOTS[userId % SPOTS.length];
  const ring = Math.floor(userId / SPOTS.length) % 4; // 자리가 겹치면 살짝 비켜 섬
  return { x: x + ring * 2.2, y: y + ring * 1.6 };
}
// 말풍선이 섬 가장자리 밖으로 잘리지 않게 안쪽으로 당김
const insideIsland = ({ x, y }) => ({ x: clampPos(x, 9, 91), y: clampPos(y, 10, 92) });
const postSpot = (neighbor) =>
  insideIsland(
    neighbor.latest_post?.map_x != null
      ? { x: neighbor.latest_post.map_x, y: neighbor.latest_post.map_y }
      : spotFor(neighbor.author.user_id),
  );

async function loadNeighbors() {
  try {
    if (!Number.isInteger(islandId) || islandId <= 0) {
      throw new Error('섬 선택 화면에서 다시 입장해주세요.');
    }

    serverNeighbors = await api(`/islands/${islandId}/neighbors`);
    updateIslandCounts();
    renderMarkers();
    loadResonance();
  } catch (error) {
    toast(error.message);
  }
}

function updateIslandCounts() {
  const online = onlineNeighbors.size;
  document.querySelectorAll(".island-counts").forEach(element => {
    element.textContent =
      `지도에 표시된 이웃: ${serverNeighbors.length}명` +
      (online ? ` · 지금 접속 ${online + 1}명` : "") +
      (footprintVisitors ? ` · 오늘 다녀간 이웃 ${footprintVisitors}명` : "");
    element.title = "공개 글을 작성한 이웃과 지금 섬을 돌아다니는 이웃";
  });
}

// 이름표: 페르소나 아이콘 + 닉네임 (+ 접속 중 점)
const nameTag = (author, cls, online = false) => `
  <span class="${cls}">
    ${online ? '<i class="online-dot" aria-label="접속 중"></i>' : ""}${escapeText(personaOf(author.character)?.icon || "")} ${escapeText(author.nickname)}
  </span>`;

const characterImg = (author, alt = "") => `
  <img class="${toneClass(author.color)}"
    src="${img(CHARACTER_KEYS.indexOf(author.character))}" alt="${alt}">`;

function renderMarkers() {
  const mine = serverNeighbors.find(neighbor => neighbor.is_me);
  const others = serverNeighbors.filter(neighbor => !neighbor.is_me);
  const items = [...footprintItems(), ...bottleItem()];

  // 섬 중앙 모닥불 (섬 온도)
  if (islandTemp) {
    items.push({
      key: "campfire",
      ...campfirePoint,
      html: `
        <button type="button" class="marker campfire level-${islandTemp.level}" data-campfire
          aria-label="섬 온도 ${islandTemp.temperature}도">
          <span class="campfire-flame" aria-hidden="true">🔥</span>
          <span class="campfire-temp">🌡️ ${islandTemp.temperature}°</span>
        </button>`,
    });
  }

  // 공명하는 이웃은 내 캐릭터 둘레로 다가옴
  const resonant = [...resonance.keys()];
  const nearMe = (userId) => {
    const index = resonant.indexOf(userId);
    const angle = (index / Math.max(resonant.length, 1)) * Math.PI * 2 + 0.6;
    let pos = {
      x: state.player.x + Math.cos(angle) * 11,
      y: state.player.y + Math.sin(angle) * 13,
    };
    // 모닥불과 겹치면 모닥불 바깥쪽으로 밀어냄
    const fx = pos.x - campfirePoint.x, fy = pos.y - campfirePoint.y;
    const gap = Math.hypot(fx, fy);
    if (gap < 9) {
      const push = (9 - gap) / Math.max(gap, 0.1);
      pos = { x: pos.x + fx * push, y: pos.y + fy * push };
    }
    return insideIsland(pos);
  };

  const placed = new Set();
  for (const neighbor of others) {
    const author = neighbor.author;
    const id = author.user_id;
    const live = onlineNeighbors.get(id);
    const similarity = resonance.get(id);
    const anchor = postSpot(neighbor);
    const away = Boolean(live || similarity);
    placed.add(id);

    // 고민을 남긴 자리: 글쓴이 형체 + 글 말풍선
    if (neighbor.latest_post) {
      items.push({
        key: "post-" + id,
        ...anchor,
        html: `
          <div class="marker post-pin ${away ? "ghost" : "wander"}">
            <button type="button" class="worry-bubble" data-post="${neighbor.latest_post.id}"
              aria-label="${escapeText(author.nickname)}의 고민: ${escapeText(neighbor.latest_post.title)}">
              ${escapeText(shortTitle(neighbor.latest_post.title))}
            </button>
            <div class="walker">
              ${characterImg(author, away ? "" : escapeText(author.nickname) + "의 캐릭터")}
              ${away ? "" : nameTag(author, "author-name")}
            </div>
          </div>`,
      });
    }

    // 접속 중이거나 공명해서 자리를 떠난 캐릭터
    if (away || !neighbor.latest_post) {
      const pos = similarity ? nearMe(id) : live ? insideIsland(live) : anchor;
      items.push({
        key: "who-" + id,
        ...pos,
        // 공명하는 이웃은 자기 고민을 남긴 자리에서 출발해 한 명씩 차례로 걸어옴
        from: similarity ? anchor : null,
        delay: similarity ? resonant.indexOf(id) * 0.9 : 0,
        html: personMarker(author, { live: Boolean(live), similarity }),
      });
    }
  }

  // 글은 없지만 지금 섬을 돌아다니는 사람
  for (const [id, live] of onlineNeighbors) {
    if (placed.has(id)) continue;
    items.push({
      key: "who-" + id,
      ...insideIsland(live),
      html: personMarker(live.author, { live: true }),
    });
  }

  // 내 고민을 남긴 자리 (내 캐릭터는 따로 움직임)
  if (mine?.latest_post?.map_x != null) {
    items.push({
      key: "post-me",
      ...postSpot(mine),
      html: `
        <div class="marker post-pin ghost mine">
          <button type="button" class="worry-bubble" data-post="${mine.latest_post.id}"
            aria-label="내 고민: ${escapeText(mine.latest_post.title)}">
            ${escapeText(shortTitle(mine.latest_post.title))}
          </button>
          <div class="walker">${characterImg(mine.author)}</div>
        </div>`,
    });
  }

  if (mine) {
    items.push({
      key: "player",
      ...state.player,
      html: `
        <div class="marker player-marker" aria-label="내 캐릭터 ${escapeText(mine.author.nickname)}">
          ${resonance.size ? `
            <button type="button" class="resonance-count" data-post="${mine.latest_post.id}"
              aria-label="내 고민과 공명하는 이웃 ${resonance.size}명, 비슷한 고민 보기">
              🔥 공명 ${resonance.size} · 닮은 고민
            </button>` : mine.latest_post ? `
            <button type="button" class="worry-tag player-worry" data-post="${mine.latest_post.id}"
              aria-label="내 최근 고민 보기">고민</button>` : ""}
          ${characterImg(mine.author)}
          ${nameTag(mine.author, "player-name")}
        </div>`,
    });
  }

  syncMarkers(items);
}

function personMarker(author, { live = false, similarity = null } = {}) {
  return `
    <div class="marker author-pin person ${live ? "live" : "wander"} ${similarity ? "resonant" : ""}">
      ${similarity ? `
        <span class="resonance-tag" title="내 고민과 비슷한 정도 ${Math.round(similarity * 100)}%">
          🔥 공명
        </span>` : ""}
      <div class="walker">
        ${characterImg(author, escapeText(author.nickname) + "의 캐릭터")}
        ${nameTag(author, "author-name", live)}
      </div>
    </div>`;
}

// 바뀐 마커만 다시 그려서, 위치가 바뀐 캐릭터는 부드럽게 걸어가게 함
const WALK_SECONDS = 7; // 공명 이웃이 내 곁까지 걸어오는 시간 (css .author-pin.resonant와 같게)
function syncMarkers(items) {
  const layer = el("markers");
  const existing = new Map(
    [...layer.children].map(node => [node.dataset.key, node]),
  );

  for (const item of items) {
    let node = existing.get(item.key);
    if (!node || node._html !== item.html) {
      const holder = document.createElement("div");
      holder.innerHTML = item.html.trim();
      const fresh = holder.firstElementChild;
      fresh.dataset.key = item.key;
      fresh._html = item.html;
      if (node) {
        // 이전 자리에서 출발해야 걸어가는 모습이 보임
        fresh.style.left = node.style.left;
        fresh.style.top = node.style.top;
        node.replaceWith(fresh);
        void fresh.offsetWidth;
      } else if (item.from) {
        // 처음 나타나는 공명 이웃: 출발 자리에 세운 뒤 내 곁까지 천천히 걸어오게
        fresh.style.left = item.from.x + "%";
        fresh.style.top = item.from.y + "%";
        fresh.style.transitionDelay = item.delay + "s";
        fresh.classList.add("approaching");
        fresh.classList.toggle("facing-left", item.x < item.from.x);
        layer.append(fresh);
        void fresh.offsetWidth;
        setTimeout(() => {
          fresh.classList.remove("approaching");
          fresh.style.transitionDelay = "";
        }, (item.delay + WALK_SECONDS) * 1000);
      } else {
        fresh.style.left = item.x + "%";
        fresh.style.top = item.y + "%";
        layer.append(fresh);
      }
      node = fresh;
    }
    node.style.left = item.x + "%";
    node.style.top = item.y + "%";
    // 지도 가장자리 말풍선은 안쪽으로 펼쳐서 화면 밖으로 잘리지 않게
    node.classList.toggle("edge-right", item.x > 78);
    node.classList.toggle("edge-left", item.x < 22);
    existing.delete(item.key);
  }

  existing.forEach(node => node.remove());
}

// 접속하지 않은 캐릭터도 제자리 근처를 어슬렁거림
setInterval(() => {
  if (document.hidden) return;
  document.querySelectorAll("#markers .wander .walker").forEach(walker => {
    const x = Math.round((Math.random() - 0.5) * 26);
    const y = Math.round((Math.random() - 0.5) * 14);
    walker.style.transform = `translate(${x}px, ${y}px)`;
    walker.classList.toggle("facing-left", x < 0);
  });
}, 3200);

// ── 처음 들어온 사람을 위한 안내 (한 번만 자동으로, 이후엔 ? 버튼) ──
function setupWorldGuide() {
  const guide = document.createElement("dialog");
  guide.className = "world-guide";
  guide.setAttribute("aria-labelledby", "worldGuideTitle");
  guide.innerHTML = `
    <form method="dialog">
      <h2 id="worldGuideTitle">섬에 오신 걸 환영해요</h2>
      <ul>
        <li><b>움직이기</b> 방향키·WASD 또는 지도를 눌러 내 캐릭터를 옮겨요. 초록 점이 있는 이웃은 지금 접속 중이에요.</li>
        <li><b>고민 놓기</b> 고민을 쓰면 내 캐릭터가 서 있던 자리에 글 말풍선이 남아요.</li>
        <li><b>공명</b> 나와 닮은 고민을 쓴 이웃이 내 곁으로 다가와요.</li>
        <li><b>모닥불</b> 고민과 위로가 쌓일수록 섬이 따뜻해져요. 목표는 36.5°예요.</li>
        <li><b>칭호</b> 캐릭터마다 위로 성향 칭호가 댓글에 붙어요.</li>
      </ul>
      <button value="ok" class="wide">둘러보기</button>
    </form>`;
  document.body.append(guide);

  const help = document.createElement("button");
  help.type = "button";
  help.className = "guide-button";
  help.setAttribute("aria-label", "섬 이용 안내");
  help.textContent = "?";
  help.onclick = () => guide.showModal();
  el("zoomIn").parentElement.append(help);

  let seen = false;
  try {
    seen = localStorage.getItem("ondo-world-guide") === "1";
    localStorage.setItem("ondo-world-guide", "1");
  } catch {
    // 저장소를 못 쓰면 매번 보여 줘도 괜찮음
  }
  if (!seen) guide.showModal();
}

// ── 기능 1. 공명: 내 최근 고민과 비슷한 고민을 쓴 이웃이 다가옴 ──
async function loadResonance() {
  const mine = serverNeighbors.find(neighbor => neighbor.is_me);
  const postId = mine?.latest_post?.id;
  if (!postId) return;
  try {
    if (!similarCache.has(postId)) {
      similarCache.set(postId, await api(`/posts/${postId}/similar`));
    }
    const onIsland = new Set(serverNeighbors.map(n => n.author.user_id));
    const next = new Map();
    for (const item of similarCache.get(postId)) {
      const id = item.author?.user_id;
      if (!id || id === me.id || !onIsland.has(id)) continue;
      next.set(id, Math.max(next.get(id) || 0, item.similarity));
    }
    // 가장 비슷한 이웃 4명까지만
    resonance = new Map(
      [...next].sort((a, b) => b[1] - a[1]).slice(0, 4),
    );
    renderMarkers();
  } catch (error) {
    console.error(error.message);
  }
}

// ── 실시간 접속: 몇 초마다 내 위치를 보내고 이웃 위치를 받음 ──
async function presenceTick() {
  if (!presenceEnabled || document.hidden || !Number.isInteger(islandId)) return;
  try {
    const list = await api(`/islands/${islandId}/presence`, {
      method: "POST",
      body: { x: state.player.x, y: state.player.y },
    });
    onlineNeighbors = new Map(list.map(p => [p.author.user_id, p]));
    updateIslandCounts();
    renderMarkers();
  } catch (error) {
    // 실시간 접속을 모르는 이전 서버면 조용히 끔
    if (error.status === 404 || error.status === 405) presenceEnabled = false;
  }
}

// ── 기능 4. 섬 온도: 고민과 위로 댓글이 쌓이면 모닥불이 뜨거워짐 ──
const weatherText = {
  cold: "쌀쌀한 섬이에요. 첫 위로를 건네 볼까요?",
  mild: "섬이 조금씩 따뜻해지고 있어요.",
  warm: "이웃들의 위로로 섬이 따뜻해요.",
  hot: "ON-DO 36.5° 달성! 섬이 사람 체온만큼 따뜻해요.",
};
let lastTempLevel = null;
async function loadTemperature() {
  if (!Number.isInteger(islandId)) return;
  try {
    const next = await api(`/islands/${islandId}/temperature`);
    const rose = islandTemp && next.temperature > islandTemp.temperature;
    islandTemp = next;
    el("map").dataset.weather = next.level;
    renderMarkers();
    if (rose) {
      const fire = el("markers").querySelector(".campfire");
      fire?.classList.add("flare");
      setTimeout(() => fire?.classList.remove("flare"), 1600);
    }
    if (lastTempLevel && lastTempLevel !== next.level) toast(weatherText[next.level]);
    lastTempLevel = next.level;
  } catch (error) {
    if (error.status === 404) islandTemp = null; // 이전 서버
  }
}

// ── 발자국: 최근 하루 동안 섬을 다녀간 이웃의 흔적. 지금 아무도 없어도 섬이 비어 보이지 않게 ──
let footprints = [];
let footprintVisitors = 0;
async function loadFootprints() {
  if (!Number.isInteger(islandId)) return;
  try {
    const result = await api(`/islands/${islandId}/footprints`);
    footprints = result.footprints;
    footprintVisitors = result.visitors;
    updateIslandCounts();
    renderMarkers();
  } catch {
    footprints = []; // 이전 서버면 조용히 넘어감
  }
}

function footprintItems() {
  const shown = new Set([...onlineNeighbors.keys(), ...resonance.keys()]);
  return footprints
    .filter((mark) => !shown.has(mark.user_id))
    .map((mark) => {
      const base = mark.x != null ? { x: mark.x, y: mark.y } : spotFor(mark.user_id);
      // 글 자리와 겹치지 않게 살짝 비켜서, 걸어온 방향으로 찍음
      const pos = insideIsland({ x: base.x - 3.5, y: base.y + 4 });
      const fade = Math.max(0.25, 0.8 - mark.hours_ago / 30);
      return {
        key: "foot-" + mark.user_id,
        ...pos,
        html: `
          <div class="marker footprint" style="opacity:${fade.toFixed(2)}" aria-hidden="true"
            title="${mark.hours_ago < 1 ? "조금 전" : Math.round(mark.hours_ago) + "시간 전"}에 다녀간 이웃">
            <i></i><i></i><i></i>
          </div>`,
      };
    });
}

// ── 유리병 편지: 다른 섬에서 떠내려온 고민과, 그 뒤 글쓴이가 남긴 이야기 ──
const bottlePoint = { x: 65, y: 62 }; // 강물 위
const bottleSeen = [];
let bottle = null;

async function loadBottle() {
  if (!Number.isInteger(islandId)) return;
  try {
    const params = bottleSeen.slice(-50).map((id) => `skip=${id}`).join("&");
    bottle = await api(`/islands/${islandId}/bottle${params ? "?" + params : ""}`);
  } catch {
    bottle = null; // 떠내려온 병이 없거나 이전 서버
  }
  renderMarkers();
}

function bottleItem() {
  if (!bottle) return [];
  return [{
    key: "bottle",
    ...bottlePoint,
    html: `
      <button type="button" class="marker bottle" data-bottle aria-label="떠내려온 유리병 편지 열기">
        <svg viewBox="0 0 40 24" aria-hidden="true">
          <rect x="4" y="6" width="24" height="12" rx="6" fill="#d9f2ee" stroke="#4f8f86" stroke-width="1.6"/>
          <rect x="27" y="9" width="7" height="6" rx="1.5" fill="#d9f2ee" stroke="#4f8f86" stroke-width="1.6"/>
          <rect x="33" y="8.5" width="4" height="7" rx="1.2" fill="#b0855a"/>
          <path d="M10 10h12M10 14h9" stroke="#c9a46a" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <span class="bottle-label">편지</span>
      </button>`,
  }];
}

function openBottle() {
  if (!bottle) return;
  const letter = bottle;
  let dialog = el("bottleDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "bottleDialog";
    dialog.className = "bottle-dialog";
    dialog.setAttribute("aria-labelledby", "bottleTitle");
    document.body.append(dialog);
  }
  const when = new Date(letter.created_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  dialog.innerHTML = `
    <form method="dialog" class="bottle-paper">
      <p class="bottle-from">${escapeText(letter.island_name)}에서 떠내려온 편지 · ${when}</p>
      <h2 id="bottleTitle">${escapeText(letter.title)}</h2>
      <p class="bottle-author">${escapeText(letter.author.nickname)} ${personaBadge(letter.author.character)}</p>
      <p class="bottle-body">${escapeText(letter.content)}</p>
      ${letter.follow_up ? `
        <div class="bottle-story">
          <strong>그 뒤 이야기</strong>
          <p>${escapeText(letter.follow_up)}</p>
        </div>` : ""}
      <label for="bottleReply">답장을 담아 다시 띄워 보내요</label>
      <textarea id="bottleReply" maxlength="400" rows="3" placeholder="같은 마음이었던 적이 있다면 한마디 남겨 주세요"></textarea>
      <p class="bottle-error" id="bottleError" role="alert" hidden></p>
      <div class="row bottle-actions">
        <button type="button" class="soft" id="bottleNext">다른 병 건지기</button>
        <button type="button" class="soft" id="bottleOpenPost">글 전체 보기${letter.comment_count ? ` · 위로 ${letter.comment_count}` : ""}</button>
        <button type="button" id="bottleSend">답장 띄우기</button>
      </div>
      <button value="close" class="plain bottle-close" aria-label="닫기">닫기</button>
    </form>`;

  const done = (message) => {
    bottleSeen.push(letter.post_id);
    dialog.close();
    if (message) toast(message);
    const node = el("markers").querySelector(".bottle");
    node?.classList.add("drift");
    setTimeout(loadBottle, 900);
  };
  dialog.querySelector("#bottleNext").onclick = () => done("");
  dialog.querySelector("#bottleOpenPost").onclick = () => {
    bottleSeen.push(letter.post_id);
    dialog.close();
    showPost(letter.post_id);
    loadBottle();
  };
  dialog.querySelector("#bottleSend").onclick = async (event) => {
    const text = dialog.querySelector("#bottleReply").value.trim();
    const error = dialog.querySelector("#bottleError");
    if (!text) {
      error.textContent = "답장을 한 줄 적어 주세요.";
      error.hidden = false;
      return;
    }
    event.target.disabled = true;
    try {
      await api(`/posts/${letter.post_id}/comments`, { method: "POST", body: { content: text } });
      done("답장을 담아 유리병을 다시 띄웠어요. 글쓴이에게 닿을 거예요");
    } catch (e) {
      const suggestion = e.detail?.issues?.[0]?.guide || e.detail?.suggestion;
      error.textContent = suggestion ? `${e.message} ${suggestion}` : e.message;
      error.hidden = false;
      event.target.disabled = false;
    }
  };
  dialog.showModal();
}

function showCampfireInfo() {
  if (!islandTemp) return;
  toast(
    `섬 온도 ${islandTemp.temperature}° · 최근 ${islandTemp.days}일 고민 ${islandTemp.posts}개, 위로 ${islandTemp.comments}개. ${weatherText[islandTemp.level]}`,
  );
}

// ── 방향키(또는 WASD)로 내 캐릭터 이동 ──
const moveKeys = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};
const heldKeys = new Set();
let moveFrame = null;
let lastMoveTime = 0;

const isTyping = (target) =>
  target?.closest?.("input, textarea, select, [contenteditable='true']");

function stepPlayer(time) {
  const dt = Math.min(50, time - (lastMoveTime || time));
  lastMoveTime = time;
  let mx = 0, my = 0;
  for (const key of heldKeys) {
    mx += moveKeys[key][0];
    my += moveKeys[key][1];
  }
  if (!mx && !my) {
    moveFrame = null;
    lastMoveTime = 0;
    save();
    const player = el("markers").querySelector(".player-marker");
    setTimeout(() => player?.classList.remove("keyboard"), 200);
    renderMarkers(); // 공명 이웃들도 새 자리 둘레로
    return;
  }
  const speed = 0.018 * dt; // 1초에 약 18%
  const length = Math.hypot(mx, my);
  state.player = {
    x: Number(clampPos(state.player.x + (mx / length) * speed, 4, 96).toFixed(2)),
    y: Number(clampPos(state.player.y + (my / length) * speed * 1.33, 7, 93).toFixed(2)),
  };
  const player = el("markers").querySelector(".player-marker");
  if (player) {
    player.classList.add("keyboard");
    player.classList.toggle("facing-left", mx < 0 || (mx === 0 && player.classList.contains("facing-left")));
    player.style.left = state.player.x + "%";
    player.style.top = state.player.y + "%";
  }
  moveFrame = requestAnimationFrame(stepPlayer);
}

document.addEventListener("keydown", (event) => {
  if (!moveKeys[event.key] || event.altKey || event.ctrlKey || event.metaKey) return;
  if (isTyping(event.target) || document.querySelector("dialog[open]")) return;
  event.preventDefault();
  heldKeys.add(event.key);
  if (!moveFrame) moveFrame = requestAnimationFrame(stepPlayer);
});
document.addEventListener("keyup", (event) => heldKeys.delete(event.key));
window.addEventListener("blur", () => heldKeys.clear());

let detailRequestId = 0;
let currentPostId = null; // 지금 상세 창에 떠 있는 글
let replyTo = null; // 답글 대상 { postId, id, name }
let aiPending = null; // AI 이어 답글 대기 { postId, baseline }
let aiPollToken = 0;
const similarCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 상담 안내(글·댓글 작성 응답의 crisis_support) 표시
function showCrisisSupport(support) {
  if (!support) return;
  alert(
    [
      support.message,
      ...(support.resources || []).map((resource) =>
        typeof resource === "string"
          ? resource
          : [resource.name, resource.phone, resource.hours]
              .filter(Boolean)
              .join(" · "),
      ),
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
}

const commentName = (comment) =>
  comment.is_ai ? "온도 · AI 이웃" : comment.author?.nickname || "떠난 이용자";

// 댓글 하나 그리기 (답글이면 child 클래스로 한 단계 들여쓰기)
function renderComment(comment, post, child = false) {
  const cls = child ? "reply child" : "reply";

  // 가려진·삭제된 댓글은 이름·아바타·버튼 없이 안내 문구만
  if (comment.is_hidden || comment.is_deleted) {
    const canAppeal = comment.is_mine && comment.is_hidden;
    return `
      <div class="${cls}">
        <p class="muted">${escapeText(comment.content)}</p>
        ${canAppeal ? `<button type="button" class="soft" data-appeal-comment="${comment.id}">이의 제기</button>` : ""}
      </div>`;
  }

  const avatar = comment.is_ai
    ? "assets/welcome/welcome-heart.png"
    : img(CHARACTER_KEYS.indexOf(comment.author?.character));
  const canReport = !comment.is_mine && !comment.is_ai;
  const canDelete = comment.is_mine && !comment.is_ai;
  const canThank = post.is_mine && !comment.is_ai && !comment.is_mine;
  const canReply = post.visibility === "public";

  return `
    <div class="${cls}">
      <strong>
        <img class="reply-avatar ${comment.is_ai ? "" : toneClass(comment.author?.color)}" src="${avatar}" alt="">${escapeText(commentName(comment))}
        ${comment.is_ai ? "" : personaBadge(comment.author?.character)}
      </strong>
      <p>${escapeText(comment.content)}</p>
      <div class="row reply-actions">
        ${canReply ? `<button type="button" class="soft" data-reply-to="${comment.id}">답글</button>` : ""}
        ${canThank ? `<button type="button" class="soft" data-thank-comment="${comment.id}" aria-pressed="${comment.thanked}">${comment.thanked ? "♥ 고마워요" : "♡ 고마워요"}</button>` : ""}
        ${canReport ? `<button type="button" class="soft" data-report-comment="${comment.id}">신고</button>` : ""}
        ${canDelete ? `<button type="button" class="soft" data-delete-comment="${comment.id}">삭제</button>` : ""}
      </div>
    </div>`;
}

// 댓글을 루트 + 답글(한 단계)로 묶어서 그리기
function renderComments(comments, post) {
  const roots = comments.filter((c) => !c.parent_id);
  const childrenOf = (id) => comments.filter((c) => c.parent_id === id);
  return roots
    .map(
      (root) =>
        renderComment(root, post) +
        childrenOf(root.id)
          .map((c) => renderComment(c, post, true))
          .join(""),
    )
    .join("");
}

const aiReplyCount = (comments) =>
  comments.filter((c) => c.is_ai && c.parent_id).length;

// 신고 사유 선택 창. 선택한 사유 문자열 또는 취소 시 null
let reportDialog;
function askReportReason() {
  if (!reportDialog) {
    reportDialog = document.createElement("dialog");
    reportDialog.className = "report-dialog";
    reportDialog.innerHTML = `
      <form method="dialog">
        <h2>신고 사유를 골라 주세요</h2>
        <label><input type="radio" name="reportReason" value="욕설·비방" checked> 욕설·비방</label>
        <label><input type="radio" name="reportReason" value="개인정보 노출"> 개인정보 노출</label>
        <label><input type="radio" name="reportReason" value="광고·도배"> 광고·도배</label>
        <label><input type="radio" name="reportReason" value="기타"> 기타 직접 입력</label>
        <input id="reportEtc" maxlength="200" placeholder="사유를 적어 주세요 (1~200자)" hidden>
        <div class="row">
          <button value="cancel" class="soft" formnovalidate>취소</button>
          <button value="ok">신고하기</button>
        </div>
      </form>`;
    document.body.append(reportDialog);
    const etc = reportDialog.querySelector("#reportEtc");
    reportDialog.querySelectorAll("[name=reportReason]").forEach((radio) => {
      radio.onchange = () => {
        etc.hidden = radio.value !== "기타" || !radio.checked;
        etc.required = !etc.hidden;
        if (!etc.hidden) etc.focus();
      };
    });
  }

  const form = reportDialog.querySelector("form");
  form.reset();
  reportDialog.querySelector("#reportEtc").hidden = true;
  reportDialog.querySelector("#reportEtc").required = false;

  return new Promise((resolve) => {
    reportDialog.onclose = () => {
      if (reportDialog.returnValue !== "ok") return resolve(null);
      const choice = form.querySelector("[name=reportReason]:checked").value;
      const reason =
        choice === "기타"
          ? reportDialog.querySelector("#reportEtc").value.trim()
          : choice;
      resolve(reason || null);
    };
    reportDialog.returnValue = "";
    reportDialog.showModal();
  });
}

async function report(targetType, targetId, button) {
  const reason = await askReportReason();
  if (!reason) return;
  button.disabled = true;
  try {
    await api("/reports", {
      method: "POST",
      body: { target_type: targetType, target_id: targetId, reason },
    });
    toast("신고가 접수됐어요. 확인 후 조치할게요");
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
  }
}

async function appeal(targetType, targetId, button) {
  const input = prompt("이의 제기 사유를 적어 주세요. (1~200자)");
  if (input === null) return;
  const reason = input.trim();
  if (!reason || reason.length > 200) {
    alert("이의 제기 사유는 1~200자로 입력해주세요.");
    return;
  }
  button.disabled = true;
  try {
    await api("/reports/appeal", {
      method: "POST",
      body: { target_type: targetType, target_id: targetId, reason },
    });
    toast("이의 제기를 보냈어요. 운영진이 확인할게요");
  } catch (error) {
    // 409(이미 이의를 제기함) 등은 서버 문구 그대로
    toast(error.message);
  } finally {
    button.disabled = false;
  }
}

// 상세 하단 "비슷한 고민을 먼저 겪은 이웃들" 카드
async function renderSimilar(postId) {
  const box = el("similarPosts");
  if (!box) return;
  try {
    if (!similarCache.has(postId)) {
      similarCache.set(postId, await api(`/posts/${postId}/similar`));
    }
    const items = similarCache.get(postId).slice(0, 3);
    if (el("similarPosts") !== box || !items.length) return;
    box.innerHTML = `
      <h3>비슷한 고민을 먼저 겪은 이웃들</h3>
      ${items
        .map(
          (item) => `
        <button type="button" class="similar-card" data-similar="${item.id}">
          <strong>${escapeText(item.title)}</strong>
          <span>${escapeText(item.preview || "")}</span>
          <small>답글 ${item.comment_count}</small>
        </button>`,
        )
        .join("")}`;
    box.querySelectorAll("[data-similar]").forEach((card) => {
      card.onclick = () => showPost(Number(card.dataset.similar));
    });
  } catch (error) {
    // 비슷한 글은 보조 기능이라 실패해도 상세 화면은 그대로 둠
    console.error(error.message);
  }
}

// 온도(AI)의 이어 답글을 1.5초 간격으로 최대 5번 확인
async function waitForAiReply(postId, baseline) {
  const token = ++aiPollToken;
  aiPending = { postId, baseline };
  const stillHere = () =>
    token === aiPollToken && currentPostId === postId && el("detail").open;

  try {
    for (let i = 0; i < 5; i++) {
      await sleep(1500);
      if (!stillHere()) return;
      const post = await showPost(postId, false);
      if (!stillHere()) return;
      if (post && aiReplyCount(post.comments || []) > baseline) return;
    }
  } finally {
    if (token === aiPollToken) {
      aiPending = null;
      el("aiTyping")?.remove();
    }
  }
}

async function showPost(id, open = true) {
  const requestId = ++detailRequestId;

  if (currentPostId !== id) {
    replyTo = null;
    aiPollToken++; // 다른 글을 열면 이전 글의 AI 답글 대기는 멈춤
    aiPending = null;
  }
  currentPostId = id;

  if (open) {
    el("detailBody").textContent = "고민을 불러오는 중...";
    if (!el("detail").open) el("detail").showModal();
  }

  try {
    const post = await api(`/posts/${encodeURIComponent(id)}`);

    if (requestId !== detailRequestId) return null;

    const author = post.author;
    const nickname = author?.nickname || "떠난 이용자";
    const animal = CHARACTER_KEYS.indexOf(author?.character);
    const way = COMFORT_KEYS.indexOf(post.comfort_type);
    const comments = post.comments || [];
    const showTyping =
      aiPending?.postId === post.id &&
      aiReplyCount(comments) <= aiPending.baseline;
    const draftText = el("reply")?.value || "";

    el("detailBody").innerHTML = `
      <div class="between">
        <div class="row">
          <img class="detail-avatar ${toneClass(author?.color)}" src="${img(animal)}" alt="">
          <div>
            <strong>${escapeText(nickname)}</strong>
            ${personaBadge(author?.character)}
            <small>
              ${escapeText(author?.job || "")}
              ${escapeText(post.years || "")}
            </small>
          </div>
        </div>
        <button data-close="detail" class="soft">닫기</button>
      </div>

      <small class="detail-meta">
        ${escapeText(post.topic)} ·
        ${post.visibility === "private"
          ? "나만보기"
          : escapeText(ways[way] || "")}
      </small>

      ${post.is_mine ? `
        <div class="row">
          <button type="button" class="soft" id="editServerPost">수정</button>
          <button type="button" class="danger" id="deleteServerPost">삭제</button>
        </div>
      ` : ""}

      ${!post.is_mine ? `
        <button type="button" class="soft" id="reportServerPost">신고</button>
      ` : ""}
      ${!post.is_mine && author?.user_id ? `
        <button type="button" class="soft" id="blockPostAuthor">작성자 차단</button>
      ` : ""}

      ${post.is_mine && post.status === "hidden" ? `
        <div class="hidden-banner" role="status">
          <span>신고가 쌓여 가려졌어요. 다른 이웃에게는 보이지 않아요.</span>
          <button type="button" class="soft" id="appealPost">이의 제기</button>
        </div>
      ` : ""}

      <h2 class="detail-title">${escapeText(post.title)}</h2>
      <p class="post-text">${escapeText(post.content)}</p>

      <button
        type="button"
        class="soft"
        id="reactionButton"
        aria-pressed="${post.reacted_by_me}"
      >
        ${post.reacted_by_me ? "♥" : "♡"} 공감 ${post.reaction_count}
      </button>

      ${post.is_mine && post.visibility === "private" ? `
      <section class="private-chat" id="privateChat" aria-labelledby="privateChatTitle">
        <h3 id="privateChatTitle">온도와 둘만의 이야기</h3>
        <p class="private-note">나만보기 글이라 이 대화는 나만 볼 수 있어요. 글을 공개로 바꿔도 이웃에게 보이지 않아요.</p>
        <div class="chat-log" id="chatLog" aria-live="polite">대화를 불러오는 중...</div>
        <form id="chatForm" class="row" hidden>
          <label class="sr-only" for="chatInput">온도에게 할 말</label>
          <input id="chatInput" maxlength="500" placeholder="편하게 이어서 이야기해 주세요" autocomplete="off">
          <button>보내기</button>
        </form>
        <small class="chat-remaining" id="chatRemaining"></small>
      </section>` : `
      <section class="replies">
        <h3>함께 건넨 위로 ${
          comments.filter(comment => !comment.is_deleted).length
        }</h3>

        ${renderComments(comments, post)}

        ${showTyping ? `<p id="aiTyping" class="ai-typing" aria-live="polite">온도가 답글을 쓰고 있어요…</p>` : ""}

        ${post.visibility === "public" ? `
          <form id="replyForm">
            <label for="reply">따뜻한 위로를 남겨주세요.</label>
            <p id="replyTarget" class="reply-target" hidden>
              <span></span> · <button type="button" class="plain" id="cancelReply">취소</button>
            </p>
            <div class="row">
              <input
                id="reply"
                required
                maxlength="400"
                placeholder="답글을 적어주세요"
              >
              <button>등록</button>
            </div>
          </form>
        ` : ""}
      </section>`}

      <section id="similarPosts" class="similar-posts"></section>
    `;

    renderSimilar(post.id);
    if (post.is_mine && post.visibility === "private") setupPrivateChat(post.id);

    const body = el("detailBody");

    body.querySelectorAll("[data-delete-comment]").forEach(button => {
      button.onclick = async () => {
        if (!confirm("이 댓글을 삭제할까요?")) return;

        button.disabled = true;

        try {
          await api(
            `/posts/${post.id}/comments/${button.dataset.deleteComment}`,
            { method: "DELETE" }
          );

          await showPost(post.id, false);
          await renderFeed();
          toast("댓글을 삭제했어요.");
        } catch (error) {
          alert(error.message);
        } finally {
          button.disabled = false;
        }
      };
    });

    body.querySelectorAll("[data-thank-comment]").forEach(button => {
      button.onclick = async () => {
        button.disabled = true;
        try {
          const result = await api(
            `/posts/${post.id}/comments/${button.dataset.thankComment}/thanks`,
            { method: "POST" }
          );
          button.setAttribute("aria-pressed", String(result.thanked));
          button.textContent = result.thanked ? "♥ 고마워요" : "♡ 고마워요";
        } catch (error) {
          alert(error.message);
        } finally {
          button.disabled = false;
        }
      };
    });

    body.querySelectorAll("[data-report-comment]").forEach(button => {
      button.onclick = () =>
        report("comment", Number(button.dataset.reportComment), button);
    });

    body.querySelectorAll("[data-appeal-comment]").forEach(button => {
      button.onclick = () =>
        appeal("comment", Number(button.dataset.appealComment), button);
    });

    if (el("appealPost")) {
      el("appealPost").onclick = () => appeal("post", post.id, el("appealPost"));
    }

    el("reactionButton").onclick = async () => {
      const button = el("reactionButton");
      if (button.disabled) return;

      button.disabled = true;

      try {
        const result = await api(`/posts/${post.id}/reactions`, {
          method: "POST"
        });

        button.setAttribute("aria-pressed", String(result.reacted));
        button.textContent =
          `${result.reacted ? "♥" : "♡"} 공감 ${result.reaction_count}`;
      } catch (error) {
        alert(error.message);
      } finally {
        button.disabled = false;
      }
    };

    if (post.is_mine) {
      el("editServerPost").onclick = () => {
        el("detail").close();

        editor({
          id: post.id,
          title: post.title,
          body: post.content,
          topic: post.topic,
          way: COMFORT_KEYS.indexOf(post.comfort_type),
          private: post.visibility === "private",
          years: post.years || ""
        });
      };

      el("deleteServerPost").onclick = async () => {
        if (!confirm("이 고민을 삭제할까요? 삭제 후에는 복구할 수 없어요.")) {
          return;
        }

        const button = el("deleteServerPost");
        button.disabled = true;

        try {
          await api(`/posts/${post.id}`, {
            method: "DELETE"
          });

          el("detail").close();

          await Promise.all([
            renderFeed(),
            loadNeighbors()
          ]);

          toast("고민을 삭제했어요.");
        } catch (error) {
          alert(error.message);
        } finally {
          button.disabled = false;
        }
      };
    }

    const reportButton = el("reportServerPost");
    if (reportButton) {
      reportButton.onclick = () => report("post", post.id, reportButton);
    }

    const blockButton = el("blockPostAuthor");

    if (blockButton) {
      blockButton.onclick = async () => {
        if (!confirm(`${nickname}님을 차단할까요? 이 이용자의 글과 댓글이 숨겨져요.`)) {
          return;
        }

        blockButton.disabled = true;

        try {
          await api("/blocks", {
            method: "POST",
            body: { user_id: author.user_id }
          });

          el("detail").close();

          await Promise.all([
            renderFeed(),
            loadNeighbors(),
            updateBadge()
          ]);

          toast("이용자를 차단했어요.");
        } catch (error) {
          alert(error.message);
        } finally {
          blockButton.disabled = false;
        }
      };
    }

    const form = el("replyForm");
    if (!form) return post;

    const input = el("reply");
    input.value = draftText; // 폴링으로 다시 그려도 쓰던 내용 유지

    // 답글 대상 표시 ("○○님에게 답글 · 취소")
    const updateReplyTarget = () => {
      const target = el("replyTarget");
      const active = replyTo?.postId === post.id;
      target.hidden = !active;
      if (active) target.querySelector("span").textContent = `${replyTo.name}님에게 답글`;
    };
    updateReplyTarget();

    body.querySelectorAll("[data-reply-to]").forEach(button => {
      button.onclick = () => {
        const target = comments.find(c => c.id === Number(button.dataset.replyTo));
        replyTo = {
          postId: post.id,
          id: target.id,
          name: target.is_ai ? "온도" : commentName(target)
        };
        updateReplyTarget();
        input.focus();
      };
    });

    el("cancelReply").onclick = () => {
      replyTo = null;
      updateReplyTarget();
      input.focus();
    };

    form.onsubmit = async event => {
      event.preventDefault();

      const content = input.value.trim();
      const button = form.querySelector("button:not(.plain)");

      if (!content || button.disabled) return;

      const parentId = replyTo?.postId === post.id ? replyTo.id : null;
      const parent = comments.find(c => c.id === parentId);
      const root = parent?.parent_id
        ? comments.find(c => c.id === parent.parent_id)
        : parent;
      const toAiThread = Boolean(parent && (parent.is_ai || root?.is_ai));

      button.disabled = true;
      button.textContent = "등록 중...";

      try {
        const result = await api(`/posts/${post.id}/comments`, {
          method: "POST",
          body: parentId ? { content, parent_id: parentId } : { content }
        });

        input.value = "";
        replyTo = null;

        if (result.ai_reply_pending === true) {
          aiPending = { postId: post.id, baseline: aiReplyCount(comments) };
        }

        await showPost(post.id, false);
        await renderFeed();
        toast("답글을 남겼어요.");

        showCrisisSupport(result.crisis_support);

        if (result.ai_reply_pending === true) {
          waitForAiReply(post.id, aiReplyCount(comments));
        } else if (post.is_mine && toAiThread) {
          toast("이제 이웃들이 함께할 거예요");
        }
      } catch (error) {
        alert(
          [
            error.message,
            error.detail?.suggestion
          ].filter(Boolean).join("\n\n")
        );
      } finally {
        button.disabled = false;
        button.textContent = "등록";
      }
    };

    return post;
  } catch (error) {
    if (requestId !== detailRequestId) return null;
    el("detailBody").textContent = error.message;
    return null;
  }
}

// 상세 창을 닫으면 AI 답글 대기도 멈춤
el("detail").addEventListener("close", () => {
  currentPostId = null;
  aiPollToken++;
  aiPending = null;
});

let serverUnreadCount = 0;

async function updateBadge({ announce = false } = {}) {
  try {
    const result = await api("/notifications?limit=1");

    if (announce && result.unread_count > serverUnreadCount) {
      toast("새 알림이 왔어요. 프로필의 알림에서 확인해 보세요");
    }
    serverUnreadCount = result.unread_count;
    el("badge").textContent = serverUnreadCount;
    el("badge").hidden = serverUnreadCount === 0;
  } catch (error) {
    el("badge").hidden = true;
    console.error(error.message);
  }
}

async function loadMyPosts(selectedTab) {
  const container = el("myServerPosts");
  if (!container) return;

  const visibility = selectedTab === "private" ? "private" : "public";

  try {
    const posts = await api(
      `/users/me/posts?visibility=${visibility}`
    );

    // 응답을 기다리는 동안 탭을 바꿨다면 이전 화면을 갱신하지 않음
    if (
      el("myServerPosts") !== container ||
      tab !== selectedTab
    ) return;

    container.innerHTML = posts.map(post => `
      <article>
        <button class="soft" data-post="${post.id}">
          ${post.has_unread ? "● " : ""}${escapeText(post.title)}
        </button>
        <small>
          ${escapeText(post.topic)} · 답글 ${post.comment_count}
        </small>
        <small>
          ${escapeText(new Date(post.created_at).toLocaleString("ko-KR"))}
        </small>
      </article>
    `).join("") || "<p>작성한 고민이 없어요.</p>";
  } catch (error) {
    if (el("myServerPosts") === container) {
      container.textContent = error.message;
    }
  }
}

// 알림 종류별 문구와 표시할 이름 (이름이 없으면 null)
function notificationText(n) {
  const who = n.is_ai ? "온도" : n.actor?.nickname || null;
  switch (n.type) {
    case "comment":
      return { text: n.is_ai ? "온도가 첫 댓글을 남겼어요" : "내 고민에 댓글이 달렸어요", name: who };
    case "reply":
      return { text: n.is_ai ? "온도가 답했어요" : "내 댓글에 답글이 달렸어요", name: who };
    case "reaction":
      return { text: "이웃이 내 고민에 공감했어요", name: n.actor?.nickname || null };
    case "invite":
      return { text: "비슷한 고민을 가진 이웃이 글을 올렸어요. 경험을 나눠 줄래요?", name: null };
    case "thanks":
      return { text: "글쓴이가 내 댓글에 고마워했어요", name: null };
    case "hidden":
      return { text: "신고가 쌓여 내 글이나 댓글이 가려졌어요", name: null };
    case "restored":
      return { text: "검토 결과 문제가 없어 다시 보이게 했어요", name: null };
    default:
      return { text: "새 알림", name: null };
  }
}

async function loadNotifications() {
  const container = el("serverAlerts");
  if (!container) return;

  try {
    const result = await api("/notifications?limit=50");

    if (el("serverAlerts") !== container) return;

    serverUnreadCount = result.unread_count;
    el("badge").textContent = serverUnreadCount;
    el("badge").hidden = serverUnreadCount === 0;

    container.innerHTML = result.notifications.map(notification => {
      const { text, name } = notificationText(notification);
      return `
      <button
        class="alert-row"
        data-notification-post="${notification.post_id}"
      >
        <span>
          <strong>${notification.is_read ? "" : "● "}${escapeText(notification.post_title)}</strong>
          <small>
            ${escapeText(text)}${name ? ` · ${escapeText(name)}` : ""}
          </small>
          <small>
            ${escapeText(
              new Date(notification.created_at).toLocaleString("ko-KR")
            )}
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </button>
    `;
    }).join("") || "<p>아직 받은 알림이 없어요.</p>";

    container.querySelectorAll("[data-notification-post]")
      .forEach(button => {
        button.onclick = async () => {
          button.disabled = true;

          try {
            const postId = Number(button.dataset.notificationPost);

            await api("/notifications/read", {
              method: "POST",
              body: { post_id: postId }
            });

            await showPost(postId);
            await updateBadge();

            if (el("serverAlerts") === container) {
              await loadNotifications();
            }
          } catch (error) {
            alert(error.message);
          } finally {
            button.disabled = false;
          }
        };
      });
  } catch (error) {
    if (el("serverAlerts") === container) {
      container.textContent = error.message;
    }
  }
}

async function showBlockedUsers() {
  // 이전 글 상세 요청이 차단 목록을 덮어쓰지 않도록 무효화
  const requestId = ++detailRequestId;
  const container = el("detailBody");

  container.textContent = "차단 목록을 불러오는 중...";
  if (!el("detail").open) el("detail").showModal();

  try {
    const users = await api("/blocks");

    if (requestId !== detailRequestId) return;

    container.innerHTML = `
      <div class="between">
        <h2>차단한 이용자</h2>
        <button class="soft" data-close="detail">닫기</button>
      </div>

      ${users.map(user => `
        <article class="reply">
          <strong>${escapeText(user.nickname)}</strong>
          <button
            type="button"
            class="soft"
            data-unblock-user="${user.user_id}"
          >차단 해제</button>
        </article>
      `).join("") || "<p>차단한 이용자가 없어요.</p>"}
    `;

    container.querySelectorAll("[data-unblock-user]")
      .forEach(button => {
        button.onclick = async () => {
          if (!confirm("이 이용자의 차단을 해제할까요?")) return;

          button.disabled = true;

          try {
            await api(`/blocks/${button.dataset.unblockUser}`, {
              method: "DELETE"
            });

            await Promise.all([
              renderFeed(),
              loadNeighbors(),
              updateBadge()
            ]);

            if (requestId === detailRequestId && el("detail").open) {
              await showBlockedUsers();
            }

            toast("차단을 해제했어요.");
          } catch (error) {
            alert(error.message);
          } finally {
            button.disabled = false;
          }
        };
      });
  } catch (error) {
    if (requestId === detailRequestId) {
      container.textContent = error.message;
    }
  }
}

async function loadMyComments() {
  const container = el("myServerComments");
  if (!container) return;

  try {
    const comments = await api("/users/me/comments");

    if (el("myServerComments") !== container) return;

    container.innerHTML = comments.map(comment => `
      <article class="reply">
        <button
          type="button"
          class="soft"
          ${comment.post_id === null
            ? "disabled"
            : `data-post="${comment.post_id}"`}
        >
          ${comment.post_id === null
            ? "현재 볼 수 없는 글"
            : escapeText(comment.post_title)}
        </button>
        <p>${escapeText(comment.content)}</p>
        <small>
          ${escapeText(
            new Date(comment.created_at).toLocaleString("ko-KR")
          )}
        </small>
      </article>
    `).join("") || "<p>아직 작성한 댓글이 없어요.</p>";
  } catch (error) {
    if (el("myServerComments") === container) {
      container.textContent = error.message;
    }
  }
}

function personal(detail = null) {
  const section = el("personal");
  const unread = serverUnreadCount;
  const tabs = [
    ["alerts", unread ? "댓글 알림 " + unread : "댓글 알림"],
    ["private", "나만보기"],
    ["own", "내 고민"],
    ["comments", "내 댓글"],
    ["settings", "캐릭터 설정"],
  ];
  const heading = detail
    ? "댓글 상세"
    : tab === "alerts"
      ? "댓글 알림"
      : tabs.find(([id]) => id === tab)[1];
  section.hidden = false;
  el("profile").setAttribute("aria-expanded", "true");
  let content;
  if (detail) {
    content = `<article><strong>${escapeText(detail.title)}</strong><small>${escapeText(detail.name)}</small><p>${escapeText(detail.body)}</p></article><div class="row"><button data-tab="alerts" class="soft">← 알림 목록</button></div>`;
    } else if (tab === "alerts") {
    content = '<div id="serverAlerts">알림을 불러오는 중...</div>';
  } else if (tab === "comments") {
  content = '<div id="myServerComments">내 댓글을 불러오는 중...</div>';
  }else if (tab === "settings") {
    content = `<form id="profileSettings" class="profile-settings">
      <label for="profileNick">닉네임</label><input id="profileNick" maxlength="18" required value="${escapeText(me.nick)}">
      <p class="my-persona">내 칭호 ${personaBadge(CHARACTER_KEYS[me.animal])}</p>
      <strong>캐릭터</strong><div class="profile-character-grid">${characterNames.map((name, index) => `<button type="button" data-profile-animal="${index}" aria-label="${name} · ${personaOf(CHARACTER_KEYS[index])?.label || ""}" title="${personaOf(CHARACTER_KEYS[index])?.label || ""}" aria-pressed="${index === me.animal}"><img class="${toneClass(me.color)}" src="${img(index)}" alt=""><span>${personaOf(CHARACTER_KEYS[index])?.icon || ""} ${name}</span></button>`).join("")}</div>
      <button class="wide">변경사항 저장</button></form>`;
  } else {
    content = '<div id="myServerPosts">내 고민을 불러오는 중...</div>';
  }
  section.innerHTML = `<div class="between"><h3>${heading}</h3><button id="hideProfile" class="soft">닫기</button></div>
    ${detail ? "" : '<p id="mySummary" class="my-summary">활동 요약을 불러오는 중...</p>'}
    ${detail ? "" : '<div class="row personal-tabs">' + tabs.map(([id, label]) => `<button data-tab="${id}" ${id === tab ? "" : 'class="soft"'} aria-pressed="${id === tab}">${label}</button>`).join("") + "</div>"}${content}`;
  if (!detail) loadMySummary();
  if (!detail && tab === "settings") setupProfileSettings(section);
  if (!detail && (tab === "own" || tab === "private")) {
    loadMyPosts(tab);
  }
  if (!detail && tab === "alerts") {
  loadNotifications();
}
  const logoutButton = document.createElement("button");
logoutButton.type = "button";
logoutButton.className = "soft";
logoutButton.textContent = "로그아웃";

logoutButton.onclick = () => {
  logoutButton.disabled = true;
  logout();
};

const blocksButton = document.createElement("button");
blocksButton.type = "button";
blocksButton.className = "soft";
blocksButton.textContent = "차단한 이용자";
blocksButton.onclick = showBlockedUsers;

section.append(blocksButton);
section.append(logoutButton);
if (!detail && tab === "comments") {
  loadMyComments();
}
}

// 마이페이지 상단 활동 요약
async function loadMySummary() {
  const box = el("mySummary");
  if (!box) return;
  try {
    const s = await api("/users/me/summary");
    if (el("mySummary") !== box) return;
    box.textContent = `내가 도운 고민 ${s.posts_helped}개 · 받은 고마워요 ${s.thanks_received}개 · 쓴 글 ${s.post_count} · 쓴 댓글 ${s.comment_count}`;
  } catch (error) {
    if (el("mySummary") === box) box.textContent = "활동 요약을 불러오지 못했어요.";
  }
}

// 설정 탭: "비슷한 고민 초대 받기" (바꾸면 바로 저장)
async function setupInviteSetting(form) {
  const label = document.createElement("label");
  label.className = "invite-setting";
  label.innerHTML = '<input type="checkbox" id="acceptInvites" disabled> 비슷한 고민 초대 받기';
  form.after(label);
  const box = label.querySelector("input");

  try {
    const profile = await api("/auth/me");
    box.checked = profile.accept_invites !== false;
    box.disabled = false;
  } catch (error) {
    label.append(" (불러오지 못했어요)");
    return;
  }

  box.onchange = async () => {
    box.disabled = true;
    try {
      const updated = await api("/users/me", {
        method: "PATCH",
        body: { accept_invites: box.checked }
      });
      box.checked = updated.accept_invites !== false;
      toast(box.checked ? "비슷한 고민 초대를 받을게요." : "비슷한 고민 초대를 받지 않을게요.");
    } catch (error) {
      box.checked = !box.checked;
      alert(error.message);
    } finally {
      box.disabled = false;
    }
  };
}

// 설정 탭: 🎨 팔레트를 누르면 캐릭터 색감을 고를 수 있음 (바로 저장, 이웃에게도 보임)
function setupColorPalette(form) {
  const current = () => me.color || "original";
  const wrap = document.createElement("div");
  wrap.className = "color-palette";
  wrap.innerHTML = `
    <button type="button" class="soft" id="paletteToggle" aria-expanded="false" aria-controls="paletteOptions">🎨 색감 고르기</button>
    <div id="paletteOptions" class="palette-options" role="group" aria-label="캐릭터 색감" hidden>
      ${CHARACTER_COLORS.map(([key, label]) => `
        <button type="button" data-color="${key}" aria-pressed="${key === current()}">
          <img class="${toneClass(key)}" src="${img(me.animal)}" alt="">
          <span>${label}</span>
        </button>`).join("")}
    </div>`;
  form.after(wrap);

  const toggle = wrap.querySelector("#paletteToggle");
  const options = wrap.querySelector("#paletteOptions");
  toggle.onclick = () => {
    options.hidden = !options.hidden;
    toggle.setAttribute("aria-expanded", String(!options.hidden));
  };

  options.querySelectorAll("[data-color]").forEach((button) => {
    button.onclick = async () => {
      const color = button.dataset.color;
      if (color === current()) return;
      options.querySelectorAll("button").forEach((b) => (b.disabled = true));
      try {
        const updated = await api("/users/me", { method: "PATCH", body: { color } });
        if (updated.color !== color) {
          // 아직 색감을 모르는 이전 서버
          toast("서버 업데이트 후 색감을 저장할 수 있어요.");
          return;
        }
        me.color = color;
        saveProfile(me);
        el("avatar").className = toneClass(me.color);
        options.querySelectorAll("[data-color]").forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.color === color)),
        );
        loadNeighbors(); // 지도 위 내 캐릭터에도 바로 반영
        toast("캐릭터 색감을 바꿨어요.");
      } catch (error) {
        alert(error.message);
      } finally {
        options.querySelectorAll("button").forEach((b) => (b.disabled = false));
      }
    };
  });
}

function setupProfileSettings(section) {
  let selectedAnimal = me.animal;
  let requestId = 0;
  let saving = false;

  const form = el("profileSettings");
  const nick = el("profileNick");
  const submit = form.querySelector("button.wide");
  const buttons = [...section.querySelectorAll("[data-profile-animal]")];

  setupInviteSetting(form);
  setupColorPalette(form);

  nick.readOnly = true;
  nick.maxLength = 40;

  const shuffle = document.createElement("button");
  shuffle.type = "button";
  shuffle.className = "soft";
  shuffle.textContent = "다시 뽑기";
  nick.after(shuffle);

  async function recommendProfileNickname() {
    if (saving) return;

    const currentRequest = ++requestId;
    submit.disabled = true;
    nick.value = "";
    nick.placeholder = "닉네임을 추천받고 있어요...";

    try {
      const result = await api(
        `/auth/nickname?character=${CHARACTER_KEYS[selectedAnimal]}`,
        { auth: false }
      );

      if (currentRequest !== requestId) return;

      nick.value = result.nickname;
      submit.disabled = false;
    } catch (error) {
      if (currentRequest !== requestId) return;

      nick.placeholder = "다시 뽑기를 눌러주세요.";
      alert(error.message);
    }
  }

  shuffle.onclick = recommendProfileNickname;

  for (const button of buttons) {
    button.onclick = () => {
      if (saving) return;

      selectedAnimal = Number(button.dataset.profileAnimal);

      for (const choice of buttons) {
        choice.setAttribute("aria-pressed", String(choice === button));
      }

      recommendProfileNickname();
    };
  }

  form.onsubmit = async event => {
    event.preventDefault();
    if (saving || submit.disabled || !nick.value.trim()) return;

    saving = true;
    submit.disabled = true;
    shuffle.disabled = true;
    submit.textContent = "저장 중...";

    try {
      const updated = await api("/users/me", {
        method: "PATCH",
        body: {
          character: CHARACTER_KEYS[selectedAnimal],
          nickname: nick.value.trim()
        }
      });

      me.nick = updated.nickname;
      me.animal = CHARACTER_KEYS.indexOf(updated.character);

      saveProfile(me);

      el("myName").textContent = me.nick;
      el("avatar").src = img(me.animal);
  el("avatar").className = toneClass(me.color);

      await Promise.all([
        renderFeed(),
        loadNeighbors()
      ]);

      if (section.isConnected && tab === "settings") {
        personal();
      }

      toast("캐릭터와 닉네임을 변경했어요.");
    } catch (error) {
      alert(error.message);
    } finally {
      saving = false;
      submit.disabled = false;
      shuffle.disabled = false;
      submit.textContent = "변경사항 저장";
    }
  };
}

function closeProfile() {
  el("personal").hidden = true;
  el("profile").setAttribute("aria-expanded", "false");
}
function updateTopicSelection() {
  el("topicSelection").textContent = selectedTopic
    ? "선택한 주제 · " + selectedTopic
    : "세부 주제를 선택해 주세요.";
  el("topicSelection").classList.toggle("needs-topic", false);
  for (const category of el("categories").querySelectorAll(".category")) {
    category.classList.toggle(
      "selected",
      Array.from(category.querySelectorAll("[data-category-topic]")).some(
        (button) => button.dataset.categoryTopic === selectedTopic,
      ),
    );
  }
  for (const button of el("categories").querySelectorAll(
    "[data-category-topic]",
  )) {
    button.setAttribute(
      "aria-pressed",
      button.dataset.categoryTopic === selectedTopic,
    );
  }
}
function setupCategories() {
  const list = el("categories");
  list.innerHTML = Object.entries(topics)
    .map(
      ([group, items]) =>
        `<details class="category" name="worry-category"><summary>${group}</summary><div class="topic-options">
      ${items.map((topic) => `<button type="button" data-category-topic="${topic}" aria-pressed="false">${topic}</button>`).join("")}
    </div></details>`,
    )
    .join("");
  list.onclick = (event) => {
    const button = event.target.closest("[data-category-topic]");
    if (!button) return;
    selectedTopic = button.dataset.categoryTopic;
    const category = button.closest("details");
    category.open = false;
    updateTopicSelection();
    category.querySelector("summary").focus();
  };
}
function updateDraftCounts() {
  el("titleCount").textContent = el("postTitle").value.length + " / 40";
}
function showFeed(open) {
  el("feedPanel").hidden = !open;
  el("feedToggle").setAttribute("aria-expanded", open);
}
function editor(p = null) {
  editing = p?.id ?? null;
  el("postForm").reset();
  el("editorTitle").textContent = p
    ? "고민 수정"
    : "어떤 고민을 나누고 싶나요?";
  el("postTitle").value = p?.title || "";
  el("body").value = p?.body || "";
  el("postTitle").setCustomValidity("");
  el("body").setCustomValidity("");
  el("privatePost").checked = Boolean(p?.private);
  selectedTopic = p?.topic || "";
  for (const category of el("categories").querySelectorAll("details"))
    category.open = false;
  updateTopicSelection();
  el("comfort").querySelectorAll("input")[p?.way ?? 0].checked = true;
  el("shareYears").checked = p ? Boolean(p.years) : true;
  updateDraftCounts();
  el("editor").show();
}
if (me && authToken()) {
  const heading = el("villageName");
  const title = config.title(me, jobNames);
  heading.textContent = title.heading;
  el("zoomVillageName").textContent = title.zoom;
  heading.classList.toggle("long-name", heading.textContent.length > 15);
  el("myName").textContent = me.nick;
  el("avatar").src = img(me.animal);
  el("avatar").className = toneClass(me.color);

  setupCategories();
  // 받고 싶은 위로 ↔ 12간지 페르소나 칭호 연결 (들어주세요=💗 공감형 …)
  el("comfort").innerHTML = ways
    .map(
      (way, i) =>
        `<label class="toggle" title="${PERSONAS[COMFORT_KEYS[i]].label} 이웃이 잘 도와줘요"><input type="radio" name="way" value="${i}"> ${PERSONAS[COMFORT_KEYS[i]].icon} ${way}</label>`,
    )
    .join("");
  setupWorldGuide();
  // 글쓰기 창: 고민이 지도 어디에 놓이는지 안내
  const placeHint = document.createElement("p");
  placeHint.className = "place-hint";
  placeHint.textContent = "📍 지금 내 캐릭터가 서 있는 자리에 고민이 놓여요.";
  [...el("postForm").querySelectorAll("button:not([type=button])")].pop()?.before(placeHint);
  el("profile").onclick = () =>
    el("personal").hidden ? personal() : closeProfile();
  el("compose").onclick = () =>
    el("editor").open ? el("editor").close() : editor();
  el("feedToggle").onclick = () => showFeed(el("feedPanel").hidden);
  const search = el("search");
  const filters = el("searchFilters");
  function chooseComfort(value) {
    comfortFilter = value;
    for (const button of filters.querySelectorAll("[data-way]")) {
      button.setAttribute("aria-pressed", button.dataset.way === value);
    }
  }
  el("query").onfocus = el("query").onclick = () => {
    filters.hidden = false;
  };
  document.addEventListener("pointerdown", (event) => {
    if (!search.contains(event.target)) filters.hidden = true;
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") filters.hidden = true;
  });
  filters.onclick = (event) => {
    const button = event.target.closest("[data-way]");
    if (button) chooseComfort(button.dataset.way);
  };
  search.onsubmit = (event) => {
    event.preventDefault();
    searchText = el("query").value.trim();
    filters.hidden = true;
    renderFeed();
    showFeed(true);
  };
  el("query").oninput = () => {
    if (!el("query").value) {
      searchText = "";
      renderFeed();
    }
  };
  function setWaitingOnly(value) {
    waitingOnly = value;
    el("waitingToggle").setAttribute("aria-pressed", String(value));
    el("waitingToggle").classList.toggle("soft", !value);
  }
  el("waitingToggle").onclick = () => {
    setWaitingOnly(!waitingOnly);
    renderFeed();
  };
  el("reset").onclick = () => {
    searchText = el("query").value = "";
    chooseComfort("");
    setWaitingOnly(false);
    renderFeed();
  };
  el("editor").addEventListener("keydown", (event) => {
    if (event.key === "Escape") el("editor").close();
  });
  const reviewDialog = el("reviewDialog");
  let pendingDraft = null;
  let serverReview = null; // 서버(BE)가 422 NEED_EDIT로 돌려준 점검 결과
  let reviewLoading = false;
  let reviewError = "";
  let reviewRequest = 0;
  let reviewTimer;
  async function checkPost(requestId) {
    try {
      const result = await api("/posts/check", {
        method: "POST",
        body: {
          title: pendingDraft.title,
          content: pendingDraft.body,
        },
      });
      if (requestId !== reviewRequest) return;
      serverReview = result;
    } catch (error) {
      if (requestId !== reviewRequest) return;
      reviewError = "서버 점검에 실패했어요. 그래도 게시할 수 있어요.";
    } finally {
      if (requestId === reviewRequest) {
        reviewLoading = false;
        renderReview();
      }
    }
  }
  function schedulePostCheck(delay = 350) {
    clearTimeout(reviewTimer);
    const requestId = ++reviewRequest;
    serverReview = null;
    reviewError = "";
    if (!pendingDraft || pendingDraft.private) {
      reviewLoading = false;
      renderReview();
      return;
    }
    reviewLoading = true;
    renderReview();
    reviewTimer = setTimeout(() => checkPost(requestId), delay);
  }
  function showReviewResults(showResults) {
    el("suggestionPanel").hidden = showResults;
    el("resultPanel").hidden = !showResults;
  }
  el("showResults").onclick = () => {
    showReviewResults(true);
    el("resultHeading").focus();
  };
  let resumeDraft = false;
  el("yearsVisibility").hidden = !me.years;
  el("yearsPreview").textContent = me.years ? me.job + " · " + me.years : "";
  for (const field of ["postTitle", "body"])
    el(field).oninput = () => {
      el(field).setCustomValidity("");
      updateDraftCounts();
    };
  function setupReviewDraft() {
    const selectedGroup = Object.keys(topics).find((group) =>
      topics[group].includes(pendingDraft.topic),
    );
    const chip = (text, active) =>
      `<span class="review-chip${active ? " active" : ""}">${escapeText(text)}</span>`;
    const years = pendingDraft.years ? "연차 정보 공개" : "연차 정보 비공개";
    el("draftPreview").innerHTML = `
      <div class="review-chip-row" aria-label="고민 분야">${Object.keys(topics)
        .map((group) => chip(group, group === selectedGroup))
        .join("")}</div>
      <small class="review-topic">${escapeText(pendingDraft.topic)}</small>
      <div class="editor-label"><label for="reviewDraftTitle">제목</label><small>필수 · 40자 이내</small></div>
      <div class="review-field review-field-title"><div class="review-edit"><span id="reviewTitleHighlight" aria-hidden="true"></span><input id="reviewDraftTitle" maxlength="40" required></div><small id="reviewTitleCount"></small></div>
      <small class="review-caption">읽는 사람이 상황을 바로 알 수 있도록, 겪고 있는 일을 한 문장으로 적어주세요.</small>
      <div class="editor-label"><label for="reviewDraftBody">편하게 고민을 적어주세요.</label><small>필수 · 1,000자 이내</small></div>
      <div class="review-field review-body"><div class="review-edit"><span id="reviewBodyHighlight" aria-hidden="true"></span><textarea id="reviewDraftBody" maxlength="1000" required></textarea></div></div>
      <div class="editor-label"><strong>받고 싶은 위로</strong></div>
      <div class="review-chip-row">${ways.map((way, index) => chip(way, index === pendingDraft.way)).join("")}</div>
      <div class="review-visibility"><strong>${years}</strong><small>${escapeText(pendingDraft.years ? pendingDraft.job + " · " + pendingDraft.years : "")}</small></div>
      ${pendingDraft.private ? "<small>나만보기로 저장돼요.</small>" : ""}`;
    for (const [field, id] of [
      ["title", "reviewDraftTitle"],
      ["body", "reviewDraftBody"],
    ]) {
      el(id).oninput = (event) => {
        pendingDraft[field] = event.target.value;
        schedulePostCheck();
      };
    }
  }
  // 기능 3. 12간지 보안관: 회사명·개인정보를 가려서 보여 주고, 가린 내용으로 고칠 수 있게 함
  function maskDraft(issues, replace) {
    const titleLength = pendingDraft.title.length;
    const parts = { title: pendingDraft.title, body: pendingDraft.body };
    const spans = { title: [], body: [] };
    for (const issue of issues) {
      const { start, end } = issue;
      if (Number.isInteger(start) && Number.isInteger(end) && end > start) {
        if (end <= titleLength) spans.title.push([start, end, issue]);
        else if (start > titleLength) spans.body.push([start - titleLength - 1, end - titleLength - 1, issue]);
        continue;
      }
      // 위치가 없으면 같은 글자를 찾아서 가림
      for (const field of ["title", "body"]) {
        if (!issue.text) continue;
        let index = parts[field].indexOf(issue.text);
        while (index !== -1) {
          spans[field].push([index, index + issue.text.length, issue]);
          index = parts[field].indexOf(issue.text, index + issue.text.length);
        }
      }
    }
    for (const field of ["title", "body"]) {
      // 뒤에서부터 바꿔야 앞쪽 위치가 어긋나지 않음
      for (const [start, end, issue] of spans[field].sort((a, b) => b[0] - a[0])) {
        parts[field] = parts[field].slice(0, start) + replace(issue, parts[field].slice(start, end)) + parts[field].slice(end);
      }
    }
    return parts;
  }

  function showSecurityGuard(issues) {
    const personal = issues.filter((issue) => issue.type === "PERSONAL_INFO");
    if (!personal.length) return;
    const masked = maskDraft(personal, (_, text) => "●".repeat(Math.min(text.length, 6)));
    el("reviewResults").insertAdjacentHTML(
      "afterbegin",
      `<div class="guard-card" role="alert">
        <img src="${img(CHARACTER_KEYS.indexOf("tiger"))}" alt="12간지 보안관 호랑이">
        <div>
          <strong>12간지 보안관 · 호랑이</strong>
          <p>잠깐! 방금 적으신 회사명·개인정보 ${personal.length}곳은 비밀 유지를 위해 제가 가려드렸어요.</p>
          <p class="guard-preview"><b>${escapeText(masked.title)}</b><br>${escapeText(masked.body)}</p>
          <button type="button" id="applyGuardMask">가린 내용으로 고치기</button>
        </div>
      </div>`,
    );
    el("applyGuardMask").onclick = () => {
      // 무엇을 가렸는지에 맞춰 자연스러운 말로 바꿈
      const fixed = maskDraft(personal, (issue, text) => {
        if (/^(01[016789]|0\d{1,2})[-\s.]?\d{3,4}[-\s.]?\d{4}$/.test(text)) return "[전화번호]";
        if (/@/.test(text)) return "[이메일]";
        if (/^\d{6}-?\d{7}$/.test(text)) return "[주민번호]";
        if ((issue.guide || "").startsWith("회사명 대신")) return "우리 회사";
        return "○○";
      });
      pendingDraft.title = fixed.title;
      pendingDraft.body = fixed.body;
      el("reviewDraftTitle").value = fixed.title;
      el("reviewDraftBody").value = fixed.body;
      schedulePostCheck();
      renderReview();
      toast("보안관이 가린 내용으로 고쳤어요. 다시 점검할게요.");
    };
  }

  function renderReview() {
    const incomplete =
      !pendingDraft.title.trim() ||
      !pendingDraft.body.trim() ||
      pendingDraft.title.length > 40 ||
      pendingDraft.body.length > 1000;
    const blocked = serverReview?.ok === false;
    el("publishPost").disabled = Boolean(incomplete || reviewLoading || blocked);
    el("reviewStatus").textContent = pendingDraft.private
      ? "나만보기 글은 검사 없이 게시할 수 있어요."
      : incomplete
        ? "제목과 본문 길이를 확인해 주세요."
        : reviewLoading
          ? "서버에서 게시 전 점검을 진행하고 있어요."
          : reviewError
            ? reviewError
            : blocked
              ? "서버 점검에서 수정이 필요한 표현이 발견됐어요."
              : serverReview?.ok
                ? "서버 점검을 통과했어요. 게시할 수 있어요."
                : "게시 전 점검을 준비하고 있어요.";

    const issueHits = (field) => {
      const hits = [];
      const titleLength = pendingDraft.title.length;
      for (const issue of serverReview?.issues || []) {
        const start = issue.start;
        const end = issue.end;
        if (Number.isInteger(start) && Number.isInteger(end) && end > start) {
          if (field === "title" && start >= 0 && end <= titleLength) {
            hits.push({ index: start, text: pendingDraft.title.slice(start, end) });
            continue;
          }
          if (field === "body" && start > titleLength) {
            const bodyStart = start - titleLength - 1;
            const bodyEnd = end - titleLength - 1;
            if (bodyStart >= 0 && bodyEnd <= pendingDraft.body.length) {
              hits.push({ index: bodyStart, text: pendingDraft.body.slice(bodyStart, bodyEnd) });
              continue;
            }
          }
        }
        if (!issue.text) continue;
        let index = pendingDraft[field].indexOf(issue.text);
        while (index !== -1) {
          hits.push({ index, text: issue.text });
          index = pendingDraft[field].indexOf(issue.text, index + issue.text.length);
        }
      }
      return hits.sort((a, b) => a.index - b.index);
    };
    const highlight = (field) => {
      let cursor = 0;
      let html = "";
      for (const hit of issueHits(field)) {
        if (hit.index < cursor || !hit.text) continue;
        html +=
          escapeText(pendingDraft[field].slice(cursor, hit.index)) +
          "<mark>" +
          escapeText(hit.text) +
          "</mark>";
        cursor = hit.index + hit.text.length;
      }
      return html + escapeText(pendingDraft[field].slice(cursor));
    };
    for (const [field, input, mirror] of [
      ["title", "reviewDraftTitle", "reviewTitleHighlight"],
      ["body", "reviewDraftBody", "reviewBodyHighlight"],
    ]) {
      if (el(input).value !== pendingDraft[field]) el(input).value = pendingDraft[field];
      el(mirror).innerHTML = highlight(field) + (field === "body" ? "&#8203;" : "");
    }
    el("reviewTitleCount").textContent = pendingDraft.title.length + " / 40";

    const issues = serverReview?.issues || [];
    el("reviewResultSummary").textContent = reviewLoading
      ? "서버 응답을 기다리는 중"
      : serverReview
        ? `서버 점검 완료 · 문제 표현 ${issues.length}건`
        : reviewError || (pendingDraft.private ? "나만보기는 점검하지 않음" : "점검 결과 없음");
    el("reviewSuggestionSummary").textContent = serverReview?.suggestion || "";

    if (reviewLoading) {
      el("reviewResults").innerHTML = '<p class="review-note">게시할 수 있는 글인지 확인하고 있어요.</p>';
    } else if (reviewError) {
      el("reviewResults").innerHTML = `<p class="review-note">${escapeText(reviewError)}</p>`;
    } else if (serverReview) {
      const issueRows = issues.map((issue) => `<div class="review-result check-row ${blocked ? "pending" : ""}">
        <div class="between"><strong><span class="check-icon" aria-hidden="true">${blocked ? "!" : "✓"}</span>${escapeText(issue.type || "문제 표현")}</strong><small class="review-badge ${blocked ? "required" : ""}">${blocked ? "수정 필요" : "안내"}</small></div>
        <small class="check-excerpt">${escapeText(issue.text || "문제 구절 위치를 찾지 못했어요")}</small>
        ${issue.guide ? `<p>${escapeText(issue.guide)}</p>` : ""}
      </div>`).join("");
      el("reviewResults").innerHTML = blocked
        ? `<div class="review-result check-row pending"><p>${escapeText(serverReview.reason || "수정이 필요한 표현이 있어요.")}</p><p>${escapeText(serverReview.suggestion || "")}</p></div>${issueRows}`
        : `<div class="review-result check-row"><strong><span class="check-icon" aria-hidden="true">✓</span>서버 점검 통과</strong></div>${issueRows}`;
      showSecurityGuard(issues);
    } else {
      el("reviewResults").innerHTML = `<p class="review-note">${pendingDraft.private ? "나만보기 글은 검사하지 않아요." : "점검 결과가 없어요."}</p>`;
    }

    const guides = issues.map((issue) => issue.guide).filter(Boolean);
    el("reviewSuggestions").innerHTML = serverReview?.suggestion || guides.length
      ? `<div class="review-result"><p>${escapeText(serverReview?.suggestion || "")}</p>${guides.map((guide) => `<small>${escapeText(guide)}</small>`).join("")}</div>`
      : '<p class="review-note">수정 제안이 없어요.</p>';
  }
  el("closeReview").onclick = () => reviewDialog.close();
  reviewDialog.onclose = () => {
    if (!resumeDraft || !pendingDraft) return;
    el("postTitle").value = pendingDraft.title;
    el("body").value = pendingDraft.body;
    updateDraftCounts();
    el("editor").show();
  };
  el("postForm").onsubmit = (event) => {
    event.preventDefault();
    for (const field of ["postTitle", "body"]) {
      if (el(field).value.trim()) continue;
      el(field).setCustomValidity("내용을 입력해주세요.");
      el(field).reportValidity();
      return;
    }
    if (!selectedTopic) {
      el("topicSelection").textContent =
        "고민 분야를 열고 세부 주제를 선택해 주세요.";
      el("topicSelection").classList.add("needs-topic");
      el("categories").querySelector("summary").focus();
      return;
    }
    const p = {
      id: editing || "post-" + Date.now(),
      nick: me.nick,
      animal: me.animal,
      job: me.job,
      years: el("shareYears").checked ? me.years : "",
      x: 50,
      y: 55,
      title: el("postTitle").value.trim(),
      body: el("body").value.trim(),
      topic: selectedTopic,
      way: Number(new FormData(event.currentTarget).get("way")),
      private: el("privatePost").checked,
    };
    if (p.title.length > 40 || p.body.length > 1000) {
      const field = p.title.length > 40 ? el("postTitle") : el("body");
      field.setCustomValidity("글자 수 제한을 확인해주세요.");
      field.reportValidity();
      return;
    }
    pendingDraft = p;
    serverReview = null;
    showReviewResults(true);
    resumeDraft = true;
    el("editor").close();
    setupReviewDraft();
    reviewDialog.showModal();
    schedulePostCheck(0);
  };
  
  el("publishPost").onclick = async () => {
  if (!pendingDraft) return;

  const button = el("publishPost");
  if (button.disabled) return;

  const p = {
    ...pendingDraft,
    title: pendingDraft.title.trim(),
    body: pendingDraft.body.trim()
  };

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "저장 중...";

  try {
    const body = {
      title: p.title,
      content: p.body,
      topic: p.topic,
      comfort_type: COMFORT_KEYS[p.way],
      visibility: p.private ? "private" : "public",
      show_years: Boolean(p.years)
    };

    const isEditing = editing !== null;

    if (!isEditing) {
      body.island_id = islandId;
      // 지금 내 캐릭터가 서 있는 자리에 고민이 놓임
      body.map_x = state.player.x;
      body.map_y = state.player.y;
    }

    const result = await api(
      isEditing ? `/posts/${editing}` : "/posts",
      {
        method: isEditing ? "PATCH" : "POST",
        body
      }
    );

    // 저장 성공 후에만 작성 내용을 비움
    resumeDraft = false;
    pendingDraft = null;
    editing = null;
    reviewDialog.close();

    await Promise.all([
      renderFeed(),
      loadNeighbors()
    ]);

    toast(
      isEditing
        ? "수정했어요."
        : p.private
          ? "나만보기로 저장했어요."
          : "고민을 나눴어요."
    );

    showCrisisSupport(result?.crisis_support);
  } catch (error) {
    const detail = error.detail;

    if (error.status === 422 && detail?.code === "NEED_EDIT") {
      // 팝업 대신 오른쪽 점검 패널에 서버 결과를 표시
      clearTimeout(reviewTimer);
      reviewRequest++;
      reviewLoading = false;
      reviewError = "";
      serverReview = { ...detail, ok: false };
      showReviewResults(true);
      el("resultHeading").focus();
    } else {
      alert(error.message);
    }
  } finally {
    button.textContent = originalText;
    if (pendingDraft) renderReview(); // 버튼 활성 여부를 점검 결과에 맞춰 다시 계산
    else button.disabled = false;
  }
};

  el("deleteDialog").onclose = () => {
    if (el("deleteDialog").returnValue !== "delete" || !deleting) return;
    state.posts = state.posts.filter((p) => p.id !== deleting);
    delete state.replies[deleting];
    deleting = null;
    save();
    renderFeed();
    personal();
    toast("고민글을 삭제했어요.");
  };
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const {
      theme,
      post,
      close,
      alert,
      tab: targetTab,
      edit,
      delete: remove,
    } = button.dataset;
    if (button.hasAttribute("data-campfire")) showCampfireInfo();
    if (button.hasAttribute("data-bottle")) openBottle();
    if (button.dataset.themeAuto !== undefined) {
      state.themeMode = "auto";
      save();
      renderTheme();
      syncThemeWithClock();
      el("themePicker").open = false;
      el("currentTheme").focus();
    }
    if (theme) {
      state.themeMode = "manual";
      save();
      if (theme === state.theme) renderTheme();
      changeTheme(theme);
      el("themePicker").open = false;
      el("currentTheme").focus();
    }
    if (post) showPost(post);
    if (button.hasAttribute("data-cluster")) {
      const rect = button.getBoundingClientRect();
      changeZoom(2.65, rect.left + rect.width / 2, rect.top + rect.height / 2);
      dx +=
        map.clientWidth * (map.clientWidth <= 690 ? 0.5 : 0.34) -
        (rect.left + rect.width / 2 - map.getBoundingClientRect().left);
      positionMap();
      el("markers").querySelector("button")?.focus({ preventScroll: true });
    }
    if (close) el(close).close();
    if (button.id === "hideProfile") {
      closeProfile();
      el("profile").focus();
    }
    if (targetTab) {
      tab = targetTab;
      personal();
    }
    if (alert) {
      if (!state.read.includes(alert)) state.read.push(alert);
      save();
      updateBadge();
      personal(notices.find((n) => n.id === alert));
    }
    if (edit) editor(find(edit));
    if (remove) {
      deleting = remove;
      el("deleteDialog").returnValue = "";
      el("deleteDialog").showModal();
    }
  });
  let drag,
    dx = 0,
    dy = 0;
  const map = el("map"),
    world = el("world");
  function positionMap() {
    const limitX = Math.max(
      0,
      (world.offsetWidth * zoom - map.clientWidth) / 2,
    );
    const limitY = Math.max(
      0,
      (world.offsetHeight * zoom - map.clientHeight) / 2,
    );
    dx = Math.max(-limitX, Math.min(limitX, dx));
    dy = Math.max(-limitY, Math.min(limitY, dy));
    world.style.setProperty("--dx", dx + "px");
    world.style.setProperty("--dy", dy + "px");
    world.style.setProperty("--scale", zoom);
  }
  let guideTimer;
  function showZoomGuide() {
    const now = new Date();
    const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((value) => String(value).padStart(2, "0"))
      .join(".");
    const weekday = new Intl.DateTimeFormat("ko-KR", {
      weekday: "long",
    }).format(now);
    const time = new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(now);
    el("zoomTime").dateTime = now.toISOString();
    el("zoomTime").textContent = date + " " + weekday + " · " + time;
    el("zoomIdentity").hidden = false;
    if (!document.activeElement?.closest("#search")) {
      filters.hidden = true;
      el("search").classList.add("search-paused");
      el("zoomGuide").hidden = false;
    }
    clearTimeout(guideTimer);
    guideTimer = setTimeout(() => {
      el("zoomIdentity").hidden = true;
      el("zoomGuide").hidden = true;
      el("search").classList.remove("search-paused");
    }, 1400);
  }
  function changeZoom(value, x, y) {
    const box = map.getBoundingClientRect();
    const stageX = box.left + box.width / 2;
    const stageY = box.top + box.height / 2;
    const next = Math.max(1, Math.min(3.5, value));
    if (next !== zoom) showZoomGuide();
    const ratio = next / zoom;
    const ax = (x ?? stageX) - stageX;
    const ay = (y ?? stageY) - stageY;
    dx = ax + (dx - ax) * ratio;
    dy = ay + (dy - ay) * ratio;
    const revealChanged = zoom < revealZoom !== next < revealZoom;
    zoom = next;
    el("map").classList.toggle("zoomed-out", zoom < 1.6); // 멀리서 볼 땐 이름표를 줄임
    positionMap();
    el("zoomReset").textContent = Math.round(zoom * 100) + "%";
    if (revealChanged) renderMarkers();
  }
  el("zoomIn").onclick = () => changeZoom(zoom * 1.3);
  el("zoomOut").onclick = () => changeZoom(zoom / 1.3);
  el("zoomReset").onclick = () => {
    dx = dy = 0;
    changeZoom(1);
  };
  map.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      changeZoom(
        zoom * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.0035),
        event.clientX,
        event.clientY,
      );
    },
    { passive: false },
  );
  const pointers = new Map();
  let pointerOrigin = null,
    movedMap = false;
  let pinchDistance = 0;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  map.onpointerdown = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    pointerOrigin = { x: event.clientX, y: event.clientY };
    movedMap = false;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) pinchDistance = distance(...pointers.values());
    drag = { x: event.clientX - dx, y: event.clientY - dy };
    map.setPointerCapture(event.pointerId);
  };
  map.onpointermove = (event) => {
    if (!pointers.has(event.pointerId)) return;
    if (
      pointerOrigin &&
      Math.hypot(
        event.clientX - pointerOrigin.x,
        event.clientY - pointerOrigin.y,
      ) > 6
    )
      movedMap = true;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = pointers.values();
      const nextDistance = distance(a, b);
      if (pinchDistance > 0)
        changeZoom(
          (zoom * nextDistance) / pinchDistance,
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
        );
      pinchDistance = nextDistance;
    } else if (drag && pointers.size === 1) {
      dx = event.clientX - drag.x;
      dy = event.clientY - drag.y;
      positionMap();
    }
  };
  map.onlostpointercapture = (event) => {
    pointers.delete(event.pointerId);
    const remaining = pointers.values().next().value;
    drag = remaining ? { x: remaining.x - dx, y: remaining.y - dy } : null;
    pinchDistance = 0;
  };
  map.addEventListener("click", (event) => {
    if (event.target.closest("button") || movedMap) {
      movedMap = false;
      return;
    }
    const box = world.getBoundingClientRect();
    const x = Math.max(
      4,
      Math.min(96, ((event.clientX - box.left) / box.width) * 100),
    );
    const y = Math.max(
      7,
      Math.min(93, ((event.clientY - box.top) / box.height) * 100),
    );
    state.player = { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
    save();
    const player = el("markers").querySelector(".player-marker");
    if (player) {
      player.style.left = state.player.x + "%";
      player.style.top = state.player.y + "%";
    } else renderMarkers();
  });
  new ResizeObserver(positionMap).observe(map);
  document.addEventListener("click", (event) => {
    for (const category of el("categories").querySelectorAll("details[open]")) {
      if (!category.contains(event.target)) category.open = false;
    }
  });
  document.addEventListener("click", (event) => {
    const picker = el("themePicker");
    if (!picker.contains(event.target)) picker.open = false;
  });
  const themePicker = el("themePicker");
  themePicker.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    themePicker.open = true;
  });
  themePicker.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "mouse") return;
    if (el("themes").contains(document.activeElement))
      el("currentTheme").focus({ preventScroll: true });
    themePicker.open = false;
  });
  el("themePicker").addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !el("themePicker").open) return;
    el("themePicker").open = false;
    el("currentTheme").focus();
  });
  el("map").classList.add("zoomed-out");
  if (state.themeMode !== "manual") state.theme = themeForHour();
  renderTheme();
  setInterval(syncThemeWithClock, 60 * 1000); // 시간이 바뀌면 배경도 따라 바뀜
  setInterval(presenceTick, 3000); // 실시간 접속: 3초마다 내 위치 공유
  setInterval(loadTemperature, 30 * 1000); // 다른 이웃 활동으로 오른 온도 반영
  // 새 댓글·답글 알림: 화면을 보고 있을 때만 20초마다 확인
  setInterval(() => {
    if (!document.hidden) updateBadge({ announce: true });
  }, 20 * 1000);
  setupAmbient();
  presenceTick();
  updateBadge();
  renderFeed();
  loadNeighbors();
  loadFootprints();
  loadBottle();
  setInterval(loadFootprints, 60 * 1000); // 새로 다녀간 이웃 반영
}

// ── 나만보기 고민: 온도와 둘만의 대화 ──
function renderChat(result) {
  const log = el("chatLog");
  if (!log) return;
  log.innerHTML = result.messages.length
    ? result.messages.map((m) =>
        // pre-wrap이라 태그 안쪽에 공백·줄바꿈을 두지 않음
        `<p class="chat-bubble ${m.is_ai ? "from-ai" : "from-me"}"><span class="sr-only">${m.is_ai ? "온도" : "나"}: </span>${escapeText(m.content)}</p>`,
      ).join("")
    : `<button type="button" id="chatStart" class="wide">온도에게 이야기 걸기</button>`;
  log.scrollTop = log.scrollHeight;
  el("chatForm").hidden = !result.messages.length || result.remaining <= 0;
  el("chatRemaining").textContent = result.messages.length
    ? result.remaining > 0 ? `남은 대화 ${result.remaining}번` : "이 고민에서 나눌 수 있는 대화를 모두 나눴어요."
    : "";
  el("chatStart")?.addEventListener("click", () => sendChat(null));
  showCrisisSupport(result.crisis_support);
}

let chatPostId = null;
async function setupPrivateChat(postId) {
  chatPostId = postId;
  try {
    const result = await api(`/posts/${postId}/ai-chat`);
    if (chatPostId !== postId) return;
    renderChat(result);
  } catch (error) {
    if (el("chatLog")) {
      el("chatLog").textContent = error.status === 404 || error.status === 405
        ? "서버 업데이트 후 온도와 이야기할 수 있어요."
        : error.message;
    }
    return;
  }
  el("chatForm").onsubmit = (event) => {
    event.preventDefault();
    const text = el("chatInput").value.trim();
    if (text) sendChat(text);
  };
}

async function sendChat(text) {
  const postId = chatPostId;
  const log = el("chatLog");
  const input = el("chatInput");
  if (text) {
    log.querySelector("#chatStart")?.remove();
    log.insertAdjacentHTML("beforeend", `<p class="chat-bubble from-me">${escapeText(text)}</p>`);
    input.value = "";
  } else {
    log.innerHTML = "";
  }
  log.insertAdjacentHTML("beforeend", `<p class="chat-bubble from-ai typing" id="chatTyping">온도가 생각하고 있어요…</p>`);
  log.scrollTop = log.scrollHeight;
  input.disabled = true;
  try {
    const result = await api(`/posts/${postId}/ai-chat`, { method: "POST", body: text ? { content: text } : {} });
    if (chatPostId !== postId) return;
    renderChat(result);
  } catch (error) {
    el("chatTyping")?.remove();
    toast(error.message);
    if (text) input.value = text;
  } finally {
    input.disabled = false;
    if (chatPostId === postId) input.focus();
  }
}

// ── 살아 있는 섬: 시간대별 빛, 구름 그림자, 강물 반짝임, 모닥불 빛, 새·꽃잎·반딧불이 ──
// (초기화 코드가 이 파일 중간에서 먼저 실행되므로 값은 함수 안에 둔다)
function setupAmbient() {
  const world = el("world");
  if (!world || el("ambient")) return;
  // 강물 위 자리(지도 이미지 기준 %). 이미지에서 물 색 픽셀을 뽑아 정했다
  const RIVER_POINTS = [
    [66, 6], [65, 11], [67, 15], [71, 19], [75, 23], [72, 31], [67, 36], [70, 42],
    [73, 46], [76, 50], [71, 54], [64, 58], [61, 63], [56, 68], [46, 69], [39, 72],
    [31, 79], [24, 83], [15, 86], [6, 90], [12, 9], [20, 10], [26, 13], [16, 16],
    [22, 19], [96, 95],
  ];
  // 같은 화면이 매번 같게 보이도록 고정된 난수
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pick = (min, max) => (min + rand() * (max - min)).toFixed(1);

  const sparkles = RIVER_POINTS.map(([x, y], i) =>
    `<i class="sparkle" style="left:${x}%;top:${y}%;animation-delay:${(i * 0.37) % 3.2}s"></i>`).join("");
  const fireflies = Array.from({ length: 16 }, (_, i) =>
    `<i class="firefly" style="left:${pick(8, 92)}%;top:${pick(15, 92)}%;animation-delay:${pick(0, 6)}s,${pick(0, 3)}s;--fx:${pick(-30, 30)}px;--fy:${pick(-26, 10)}px"></i>`).join("");
  const petals = Array.from({ length: 10 }, () =>
    `<i class="petal" style="left:${pick(0, 100)}%;animation-delay:${pick(0, 14)}s;animation-duration:${pick(11, 17)}s"></i>`).join("");
  const bird = `<svg viewBox="0 0 24 10"><path d="M1 6 Q6 0 12 6 Q18 0 23 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  const layer = document.createElement("div");
  layer.id = "ambient";
  layer.className = "ambient";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <div class="light"></div>
    <div class="cloud-shadow one"></div>
    <div class="cloud-shadow two"></div>
    <div class="cloud-shadow three"></div>
    <div class="fire-glow" style="left:${campfirePoint.x}%;top:${campfirePoint.y}%"></div>
    ${sparkles}
    <div class="flock one">${bird}${bird}${bird}</div>
    <div class="flock two">${bird}${bird}</div>
    ${petals}
    ${fireflies}`;
  world.insertBefore(layer, el("markers"));
}
