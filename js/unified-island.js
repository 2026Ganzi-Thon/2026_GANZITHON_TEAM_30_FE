const el = (id) => document.getElementById(id);
const me = JSON.parse(localStorage.getItem("ondo-profile") || "null");
if (!me || !localStorage.getItem("ondo-token") || !sessionStorage.getItem("ondo-session"))
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
const key = "ondo-unified-v1";
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
const activeFilters = () => searchText || comfortFilter;
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
  el("themes").innerHTML = themes
    .map(
      ([id, name]) =>
        `<button type="button" data-theme="${id}" aria-label="${name}" title="${name}" aria-pressed="${id === state.theme}"><img src="assets/themes/theme-${id}.png" alt=""></button>`,
    )
    .join("");
}

let feedRequestId = 0;

async function renderFeed() {
  const requestId = ++feedRequestId;
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
          <strong>${escapeText(post.title)}</strong>
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

const clusterPoint = { x: 31, y: 57 };
const revealZoom = 2.4;
const islandId = Number(
  new URLSearchParams(location.search).get('island_id')
);

let serverNeighbors = [];

async function loadNeighbors() {
  try {
    if (!Number.isInteger(islandId) || islandId <= 0) {
      throw new Error('섬 선택 화면에서 다시 입장해주세요.');
    }

    serverNeighbors = await api(`/islands/${islandId}/neighbors`);
    document.querySelectorAll(".island-counts").forEach(element => {
      element.textContent = `지도에 표시된 이웃: ${serverNeighbors.length}명`;
      element.title = "공개 글을 작성한 이웃과 내 캐릭터 기준";
    });
    renderMarkers();
  } catch (error) {
    toast(error.message);
  }
}

function renderMarkers() {
  const mine = serverNeighbors.find(neighbor => neighbor.is_me);
  const others = serverNeighbors.filter(neighbor => !neighbor.is_me);

  const player = mine
    ? `<div
        class="marker player-marker"
        style="left:${state.player.x}%;top:${state.player.y}%"
        aria-label="내 캐릭터 ${escapeText(mine.author.nickname)}"
      >
        <img
          src="${img(CHARACTER_KEYS.indexOf(mine.author.character))}"
          alt=""
        >
        ${mine.latest_post ? `
          <button
            type="button"
            class="worry-tag player-worry"
            data-post="${mine.latest_post.id}"
            aria-label="내 최근 고민 보기"
          >고민</button>
        ` : ""}
        <span class="player-name">
          ${escapeText(mine.author.nickname)}
        </span>
      </div>`
    : '';

  if (zoom < revealZoom && others.length > 0) {
    el('markers').innerHTML = `
      <button
        class="marker cluster"
        style="left:${clusterPoint.x}%;top:${clusterPoint.y}%"
        data-cluster
        aria-label="이웃 ${others.length}명 확대해서 보기"
      >${others.length}</button>
      ${player}
    `;
    return;
  }

  el('markers').innerHTML = others.map((neighbor, index) => {
    const author = neighbor.author;
    const angle = index * 2.399963;
    const radius = others.length === 1 ? 0 : 3 + Math.sqrt(index) * 2;
    const x = clusterPoint.x + Math.cos(angle) * radius;
    const y = clusterPoint.y + Math.sin(angle) * radius * 1.15;

    return `
      <div
        class="marker author-pin"
        style="left:${x}%;top:${y}%"
      >
        <img
          src="${img(CHARACTER_KEYS.indexOf(author.character))}"
          alt="${escapeText(author.nickname)}의 캐릭터"
        >

        ${neighbor.latest_post ? `
          <button
            type="button"
            class="worry-tag"
            data-post="${neighbor.latest_post.id}"
            aria-label="${escapeText(author.nickname)}의 최근 고민 보기"
          >고민</button>
        ` : ""}
        <span class="author-name">
          ${escapeText(author.nickname)}
        </span>
      </div>
    `;
  }).join('') + player;
}

let detailRequestId = 0;

async function showPost(id, open = true) {
  const requestId = ++detailRequestId;

  if (open) {
    el("detailBody").textContent = "고민을 불러오는 중...";
    if (!el("detail").open) el("detail").showModal();
  }

  try {
    const post = await api(`/posts/${encodeURIComponent(id)}`);

    if (requestId !== detailRequestId) return;

    const author = post.author;
    const nickname = author?.nickname || "떠난 이용자";
    const animal = CHARACTER_KEYS.indexOf(author?.character);
    const way = COMFORT_KEYS.indexOf(post.comfort_type);
    const comments = post.comments || [];

    el("detailBody").innerHTML = `
      <div class="between">
        <div class="row">
          <img class="detail-avatar" src="${img(animal)}" alt="">
          <div>
            <strong>${escapeText(nickname)}</strong>
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
          <button type="button" class="soft" id="editServerPost">
            수정
          </button>
          <button type="button" class="danger" id="deleteServerPost">
            삭제
          </button>
        </div>
      ` : ""}
      
      ${!post.is_mine ? `
        <button type="button" class="soft" id="reportServerPost">
          신고
        </button>
      ` : ""}
      ${!post.is_mine && author?.user_id ? `
        <button type="button" class="soft" id="blockPostAuthor">
          작성자 차단
        </button>
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

      <section class="replies">
        <h3>함께 건넨 위로 ${
          comments.filter(comment => !comment.is_deleted).length
        }</h3>

        ${comments.map(comment => {
          const name = comment.is_deleted
            ? ""
            : comment.is_ai
              ? "온도 · AI 이웃"
              : comment.author?.nickname || "떠난 이용자";

          // AI 댓글은 ON-DO 하트, 일반 댓글은 작성자 캐릭터, 삭제된 댓글은 그림 없음
          const avatar = comment.is_deleted
            ? ""
            : comment.is_ai
              ? "assets/welcome/welcome-heart.png"
              : img(CHARACTER_KEYS.indexOf(comment.author?.character));

          return `
            <div class="reply"
              ${comment.is_deleted ? 'style="color:#888;"' : ""}>
              <strong>
                ${avatar ? `<img src="${avatar}" alt="" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:6px">` : ""}${escapeText(name)}
              </strong>
                <p>${escapeText(comment.content)}</p>

                ${!comment.is_mine && !comment.is_deleted ? `
                  <button
                    type="button"
                    class="soft"
                    data-report-comment="${comment.id}"
                  >신고</button>
                ` : ""}

                ${comment.is_mine && !comment.is_deleted && !comment.is_ai ? `
                  <button
                    type="button"
                    class="soft"
                    data-delete-comment="${comment.id}"
                  >삭제</button>
                ` : ""}
            </div>
          `;
        }).join("")}

        ${post.visibility === "public" ? `
          <form id="replyForm">
            <label for="reply">따뜻한 위로를 남겨주세요.</label>
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
      </section>
    `;

    el("detailBody")
  .querySelectorAll("[data-delete-comment]")
  .forEach(button => {
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
  reportButton.onclick = async () => {
    const input = prompt("신고 사유를 입력해주세요. (1~200자)");
    if (input === null) return;

    const reason = input.trim();

    if (!reason || reason.length > 200) {
      alert("신고 사유는 1~200자로 입력해주세요.");
      return;
    }

    reportButton.disabled = true;

    try {
      await api("/reports", {
        method: "POST",
        body: {
          target_type: "post",
          target_id: post.id,
          reason
        }
      });

      toast("신고가 접수됐어요.");
    } catch (error) {
      alert(error.message);
    } finally {
      reportButton.disabled = false;
    }
  };
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
    el("detailBody")
  .querySelectorAll("[data-report-comment]")
  .forEach(button => {
    button.onclick = async () => {
      const input = prompt("댓글 신고 사유를 입력해주세요. (1~200자)");
      if (input === null) return;

      const reason = input.trim();

      if (!reason || reason.length > 200) {
        alert("신고 사유는 1~200자로 입력해주세요.");
        return;
      }

      button.disabled = true;

      try {
        await api("/reports", {
          method: "POST",
          body: {
            target_type: "comment",
            target_id: Number(button.dataset.reportComment),
            reason
          }
        });

        toast("댓글 신고가 접수됐어요.");
      } catch (error) {
        alert(error.message);
      } finally {
        button.disabled = false;
      }
    };
  });

    const form = el("replyForm");
    if (!form) return;

    form.onsubmit = async event => {
      event.preventDefault();

      const input = el("reply");
      const content = input.value.trim();
      const button = form.querySelector("button");

      if (!content || button.disabled) return;

      button.disabled = true;
      button.textContent = "등록 중...";

      try {
        await api(`/posts/${post.id}/comments`, {
          method: "POST",
          body: { content }
        });

        await showPost(post.id, false);
        await renderFeed();
        toast("답글을 남겼어요.");
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
  } catch (error) {
    if (requestId !== detailRequestId) return;
    el("detailBody").textContent = error.message;
  }
}

let serverUnreadCount = 0;

async function updateBadge() {
  try {
    const result = await api("/notifications?limit=1");

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

async function loadNotifications() {
  const container = el("serverAlerts");
  if (!container) return;

  try {
    const result = await api("/notifications?limit=50");

    if (el("serverAlerts") !== container) return;

    serverUnreadCount = result.unread_count;
    el("badge").textContent = serverUnreadCount;
    el("badge").hidden = serverUnreadCount === 0;

    container.innerHTML = result.notifications.map(notification => `
      <button
        class="alert-row"
        data-notification-post="${notification.post_id}"
      >
        <span>
          <strong>${escapeText(notification.post_title)}</strong>
          <small>
            ${notification.is_read ? "읽은 알림" : "새 댓글"}
            · ${escapeText(
              notification.is_ai
                ? "온도 · AI 이웃"
                : notification.actor?.nickname || "떠난 이용자"
            )}
          </small>
          <small>
            ${escapeText(
              new Date(notification.created_at).toLocaleString("ko-KR")
            )}
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </button>
    `).join("") || "<p>아직 받은 알림이 없어요.</p>";

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
          ${escapeText(comment.post_title)}
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
  }else if (tab === "comments") {
  content = '<div id="myServerComments">내 댓글을 불러오는 중...</div>';
  }  else if (tab === "settings") {
    content = `<form id="profileSettings" class="profile-settings">
      <label for="profileNick">닉네임</label><input id="profileNick" maxlength="18" required value="${escapeText(me.nick)}">
      <strong>캐릭터</strong><div class="profile-character-grid">${characterNames.map((name, index) => `<button type="button" data-profile-animal="${index}" aria-label="${name}" aria-pressed="${index === me.animal}"><img src="${img(index)}" alt=""><span>${name}</span></button>`).join("")}</div>
      <button class="wide">변경사항 저장</button></form>`;
  } else {
    content = '<div id="myServerPosts">내 고민을 불러오는 중...</div>';
  }
  section.innerHTML = `<div class="between"><h3>${heading}</h3><button id="hideProfile" class="soft">닫기</button></div>
    ${detail ? "" : '<div class="row personal-tabs">' + tabs.map(([id, label]) => `<button data-tab="${id}" ${id === tab ? "" : 'class="soft"'} aria-pressed="${id === tab}">${label}</button>`).join("") + "</div>"}${content}`;
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

function setupProfileSettings(section) {
  let selectedAnimal = me.animal;
  let requestId = 0;
  let saving = false;

  const form = el("profileSettings");
  const nick = el("profileNick");
  const submit = form.querySelector("button.wide");
  const buttons = [...section.querySelectorAll("[data-profile-animal]")];

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

      localStorage.setItem("ondo-profile", JSON.stringify(me));

      el("myName").textContent = me.nick;
      el("avatar").src = img(me.animal);

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
if (me && sessionStorage.getItem("ondo-session")) {
  const heading = el("villageName");
  heading.textContent = "통합섬";
  el("zoomVillageName").textContent = "통합섬";
  heading.classList.toggle("long-name", heading.textContent.length > 15);
  el("myName").textContent = me.nick;
  el("avatar").src = img(me.animal);

  setupCategories();
  el("comfort").innerHTML = ways
    .map(
      (way, i) =>
        `<label class="toggle"><input type="radio" name="way" value="${i}"> ${way}</label>`,
    )
    .join("");
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
  el("reset").onclick = () => {
    searchText = el("query").value = "";
    chooseComfort("");
    renderFeed();
  };
  el("editor").addEventListener("keydown", (event) => {
    if (event.key === "Escape") el("editor").close();
  });
  const reviewDialog = el("reviewDialog");
  let pendingDraft = null;
  let serverReview = null; // 서버(BE)가 422 NEED_EDIT로 돌려준 점검 결과
  let originalIssues = new Map();
  function showReviewResults(showResults) {
    el("suggestionPanel").hidden = showResults;
    el("resultPanel").hidden = !showResults;
  }
  el("showResults").onclick = () => {
    showReviewResults(true);
    el("resultHeading").focus();
  };
  el("reviewResults").onclick = (event) => {
    const button = event.target.closest("[data-suggestion]");
    if (!button) return;
    showReviewResults(false);
    const row = el("reviewSuggestions")
      .querySelector('[data-rule="' + button.dataset.suggestion + '"]')
      .closest(".review-result");
    row.classList.add("selected-suggestion");
    row.querySelector("button").focus();
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
        serverReview = null; // 글을 고치면 서버 결과는 지우고 다시 게시해서 확인
        renderReview();
      };
    }
  }
  function renderReview() {
    const checks = inspectDraft(pendingDraft);
    const issues = checks.filter(
      (check) => check.replacement && check.matches.length,
    );
    checks
      .filter((c) => c.matches.length)
      .forEach((c) => {
        if (!originalIssues.has(c.label))
          originalIssues.set(c.label, c.matches[0].text);
      });
    const incomplete =
      !pendingDraft.title.trim() ||
      !pendingDraft.body.trim() ||
      pendingDraft.title.length > 40 ||
      pendingDraft.body.length > 1000;
    el("publishPost").disabled = Boolean(issues.length || incomplete || serverReview);
    el("reviewStatus").textContent = serverReview
      ? "서버 점검에서 수정이 필요한 표현이 발견됐어요. 표시된 부분을 고쳐 주세요."
      : issues.length
      ? "필수 수정 " + issues.length + "개 항목이 남았어요."
      : incomplete
        ? "제목과 본문 길이를 확인해 주세요."
        : "필수 점검을 통과했어요. 게시할 수 있어요.";
    const highlight = (field) => {
      let cursor = 0;
      let html = "";
      // 서버가 알려 준 문제 구절도 같은 방식으로 하이라이트
      const serverHits = (serverReview?.issues || [])
        .filter((issue) => issue.text)
        .flatMap((issue) =>
          [...pendingDraft[field].matchAll(new RegExp(issue.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))]
            .map((m) => ({ field, text: m[0], index: m.index })),
        );
      const hits = issues
        .flatMap((c) => c.matches)
        .concat(serverHits)
        .filter((m) => m.field === field)
        .sort((a, b) => a.index - b.index);
      for (const hit of hits) {
        if (hit.index < cursor) continue;
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
      if (el(input).value !== pendingDraft[field])
        el(input).value = pendingDraft[field];
      el(mirror).innerHTML =
        highlight(field) + (field === "body" ? "&#8203;" : "");
    }
    el("reviewTitleCount").textContent = pendingDraft.title.length + " / 40";
    const resolved = checks.filter(
      (c) => c.replacement && !c.matches.length && originalIssues.has(c.label),
    ).length;
    el("reviewResultSummary").textContent =
      checks.length +
      "개 항목 점검 · 필수 " +
      (resolved + issues.length) +
      "건 중 " +
      resolved +
      "건 반영";
    el("reviewSuggestionSummary").textContent =
      resolved +
      issues.length +
      "건 중 " +
      resolved +
      "건 반영 · 남은 필수 " +
      issues.length +
      "건";
    const serverBlock = serverReview
      ? `<div class="review-result check-row pending">
        <div class="between"><strong><span class="check-icon" aria-hidden="true">!</span>AI 서버 점검</strong><small class="review-badge required">수정 필요</small></div>
        <small class="check-excerpt">${escapeText(
          [...new Set((serverReview.issues || []).map((i) => i.text).filter(Boolean))].join(", ") ||
            "문제 구절 위치를 찾지 못했어요",
        )}</small>
        <p>${escapeText(serverReview.reason || "")}</p>
        <p>${escapeText(serverReview.suggestion || "")}</p>
      </div>`
      : "";
    el("reviewResults").innerHTML = serverBlock + checks
      .map((c) => {
        const status = c.matches.length
          ? c.note
            ? "안내"
            : "수정 필요"
          : originalIssues.has(c.label)
            ? "반영 완료"
            : "통과";
        const needsChange = status === "수정 필요";
        const excerpt = c.matches[0]?.text ?? originalIssues.get(c.label);
        const badge = needsChange
          ? `<button type="button" class="review-badge required" data-suggestion="${checks.indexOf(c)}" aria-label="${c.label} 수정 필요">수정 필요</button>`
          : `<small class="review-badge">${status}</small>`;
        return `<div class="review-result check-row ${needsChange ? "pending" : ""}">
        <div class="between"><strong><span class="check-icon" aria-hidden="true">${needsChange ? "!" : "✓"}</span>${c.label}</strong>${badge}</div>
        <small class="check-excerpt">${excerpt ? escapeText(excerpt) + (c.matches.length ? " · " + c.matches.length + "곳" : "") : "발견된 표현 없음"}</small>
        ${c.note && c.matches.length ? "<p>" + c.note + "</p>" : ""}
      </div>`;
      })
      .join("");
    el("reviewSuggestions").innerHTML =
      checks
        .filter((check) => check.replacement && originalIssues.has(check.label))
        .map((check, index) => {
          const before =
            check.matches[0]?.text ?? originalIssues.get(check.label);
          const done = !check.matches.length;
          return `<div class="review-result ${done ? "applied" : "pending"}">
        <div class="between"><strong><span class="review-number">${index + 1}</span> <span class="review-badge ${done ? "" : "required"}">필수</span> ${check.action}</strong><button type="button" data-rule="${checks.indexOf(check)}" ${done ? "disabled" : ""}>✓ ${done ? "적용됨" : "적용하기"}</button></div>
        <del>${escapeText(before)}</del><small>↵ ${escapeText(before.replace(check.pattern, check.replacement))}</small>
      </div>`;
        })
        .join("") || '<p class="review-note">남은 필수 수정 사항이 없어요.</p>';
  }
  el("reviewSuggestions").onclick = (event) => {
    const button = event.target.closest("[data-rule]");
    if (!button || !pendingDraft) return;
    serverReview = null;
    pendingDraft = applyReviewRule(
      pendingDraft,
      reviewRules[Number(button.dataset.rule)],
    );
    renderReview();
    (
      el("reviewSuggestions").querySelector("button:not(:disabled)") ||
      (el("publishPost").disabled ? el("reviewDraftTitle") : el("publishPost"))
    ).focus();
  };
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
    originalIssues = new Map();
    showReviewResults(true);
    resumeDraft = true;
    el("editor").close();
    setupReviewDraft();
    renderReview();
    reviewDialog.showModal();
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

  if (
    inspectDraft(p).some(
      check => check.replacement && check.matches.length
    )
  ) return;

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

    if (result?.crisis_support) {
      const support = result.crisis_support;

      alert(
        [
          support.message,
          ...(support.resources || []).map(resource =>
            typeof resource === "string"
              ? resource
              : Object.values(resource)
                  .filter(value => typeof value === "string")
                  .join(" · ")
          )
        ].filter(Boolean).join("\n\n")
      );
    }
  } catch (error) {
    const detail = error.detail;

    if (error.status === 422 && detail?.code === "NEED_EDIT") {
      // 팝업 대신 오른쪽 점검 패널에 서버 결과를 표시
      serverReview = detail;
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
    if (theme) {
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
  renderTheme();
  updateBadge();
  renderFeed();
  loadNeighbors();
}
