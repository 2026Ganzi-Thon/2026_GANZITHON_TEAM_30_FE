const el = (id) => document.getElementById(id);
const me = JSON.parse(localStorage.getItem("ondo-profile") || "null");
const unifiedFallback = { nick: "나", job: "개발", animal: 0, years: "" };
const unifiedProfile = me || unifiedFallback;

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
  job: ["개발", "디자인", "마케팅", "기획"][i],
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
const jobNames = {};
const save = () => localStorage.setItem(key, JSON.stringify(state));
const own = () => state.posts.filter((p) => p.nick === unifiedProfile.nick);
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

function toast(message) {
  el("notice").textContent = message;
  el("notice").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el("notice").hidden = true;
  }, 2400);
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
function renderFeed() {
  const list = [...own().filter((p) => !p.private), ...samples];
  recentWorryIds = new Set(list.slice(0, 3).map((p) => p.id));
  const words = tokenise(searchText);
  const score = (p) =>
    words.filter((word) =>
      [p.title, p.body, p.topic].join(" ").toLowerCase().includes(word),
    ).length;
  const visible = list.filter(
    (p) =>
      (!searchText || score(p) > 0) &&
      (comfortFilter === "" || p.way === Number(comfortFilter)),
  );
  if (searchText) visible.sort((a, b) => score(b) - score(a));
  el("count").textContent =
    (activeFilters() ? "조건에 맞는 고민 " : "최근 올라온 고민 ") +
    visible.length;
  el("reset").hidden = !activeFilters();
  el("feed").innerHTML =
    visible
      .map(
        (p) => `<button class="card" data-post="${p.id}">
    <small class="mode">${ways[p.way]} · ${p.time || "방금"}</small><strong>${escapeText(p.title)}</strong>
    <small>${escapeText(p.nick)} · ${escapeText(p.job)}</small>
    <small>${escapeText(p.topic)} · 답글 ${repliesFor(p).length}</small></button>`,
      )
      .join("") || "<p>조건에 맞는 고민이 없어요.</p>";
  visiblePins = visible.filter((p) => p.x);
  renderMarkers();
}
const clusterPoint = { x: 31, y: 57 };
const revealZoom = 2.4;
function renderMarkers() {
  const player = `<div class="marker player-marker" style="left:${state.player.x}%;top:${state.player.y}%" aria-label="내 캐릭터 ${escapeText(unifiedProfile.nick)}">
    <img src="${img(unifiedProfile.animal)}" alt="">
    <span class="player-name">${escapeText(unifiedProfile.nick)}</span>
  </div>`;
  if (zoom < revealZoom && visiblePins.length > 0) {
    el("markers").innerHTML =
      `<button class="marker cluster" style="left:${clusterPoint.x}%;top:${clusterPoint.y}%" data-cluster aria-label="고민 ${visiblePins.length}개 확대해서 보기">${visiblePins.length}</button>${player}`;
    return;
  }
  const total = visiblePins.length;
  el("markers").innerHTML =
    visiblePins
      .map((p, i) => {
        const angle = i * 2.399963;
        const radius = total === 1 ? 0 : 3 + Math.sqrt(i) * 2;
        const x = clusterPoint.x + Math.cos(angle) * radius;
        const y = clusterPoint.y + Math.sin(angle) * radius * 1.15;
        const isNew = recentWorryIds.has(p.id);
        return `<div class="marker author-pin" style="left:${x}%;top:${y}%">
      <button class="worry-tag${isNew ? " is-new" : ""}" data-post="${p.id}" aria-label="${escapeText(p.nick)}의 고민${isNew ? " · 최근 고민" : ""}">${isNew ? "" : "● "}고민</button>
      <img src="${img(p.animal)}" alt="${escapeText(p.nick)}의 캐릭터">
      <span class="author-name">${escapeText(p.nick)}</span>
    </div>`;
      })
      .join("") + player;
}

function showPost(id, open = true) {
  const p = find(id);
  if (!p) return;
  const replies = repliesFor(p);
  el("detailBody").innerHTML =
    `<div class="between"><div class="row"><img class="detail-avatar" src="${img(p.animal)}" alt=""><div><strong>${escapeText(p.nick)}</strong><small>${escapeText(p.job)}</small></div></div><button data-close="detail" class="soft">닫기</button></div>
    <small class="detail-meta">${escapeText(p.topic)} · ${p.private ? "나만보기" : ways[p.way]}</small>
    <h2 class="detail-title">${escapeText(p.title)}</h2><p class="post-text">${escapeText(p.body)}</p>
    ${
      p.private
        ? ""
        : `<section class="replies"><h3>함께 건넨 위로 ${replies.length}</h3>
    ${replies.map(([name, body]) => `<div class="reply"><strong>${escapeText(name)}</strong><br>${escapeText(body)}</div>`).join("")}
    <form id="replyForm"><label for="reply">따뜻한 위로를 남겨주세요.</label><div class="row"><input id="reply" required maxlength="400" placeholder="답글을 적어주세요"><button>등록</button></div></form></section>`
    }`;
  if (!p.private)
    el("replyForm").onsubmit = (event) => {
      event.preventDefault();
      const body = el("reply").value.trim();
      if (!body) return;
      (state.replies[id] ??= []).push([unifiedProfile.nick, body]);
      save();
      renderFeed();
      showPost(id, false);
      el("reply").focus();
      toast("답글을 남겼어요.");
    };
  if (open && !el("detail").open) el("detail").showModal();
}
function updateBadge() {
  const unread = notices.filter((n) => !state.read.includes(n.id)).length;
  el("badge").textContent = unread;
  el("badge").hidden = !unread;
}
function personal(detail = null) {
  const section = el("personal");
  const unread = notices.filter((n) => !state.read.includes(n.id)).length;
  const tabs = [
    ["alerts", unread ? "댓글 알림 " + unread : "댓글 알림"],
    ["private", "나만보기"],
    ["own", "내 고민"],
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
    content = notices
      .map(
        (n) => `<button data-alert="${n.id}" class="alert-row">
      <span><strong>${escapeText(n.title)}</strong><small>${state.read.includes(n.id) ? "읽은 예시 댓글" : "새 댓글이 달렸어요"} · ${n.time}</small></span><span aria-hidden="true">›</span>
    </button>`,
      )
      .join("");
  } else {
    content =
      own()
        .filter((p) => p.private === (tab === "private"))
        .map(
          (p) => `<article>
      <button class="soft" data-post="${p.id}">${escapeText(p.title)}</button><small>${escapeText(p.topic)} · 답글 ${repliesFor(p).length}</small>
      <div class="row"><button data-edit="${p.id}" class="soft">수정</button><button data-delete="${p.id}" class="danger">삭제</button></div></article>`,
        )
        .join("") || "<p>작성한 고민이 없어요.</p>";
  }
  section.innerHTML = `<div class="between"><h3>${heading}</h3><button id="hideProfile" class="soft">닫기</button></div>
    ${detail ? "" : '<div class="row personal-tabs">' + tabs.map(([id, label]) => `<button data-tab="${id}" ${id === tab ? "" : 'class="soft"'} aria-pressed="${id === tab}">${label}</button>`).join("") + "</div>"}${content}`;
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
if (unifiedProfile) {
  const heading = el("villageName");
  heading.textContent = "통합섬";
  const koreanJob = { 디자인: "디자이너", 개발: "개발자", 마케팅: "마케터" }[
    unifiedProfile.job
  ];
  el("zoomVillageName").textContent = koreanJob
    ? heading.textContent
    : heading.textContent;
  heading.classList.toggle("long-name", heading.textContent.length > 15);
  el("myName").textContent = unifiedProfile.nick;
  el("avatar").src = img(unifiedProfile.animal);

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
  el("yearsVisibility").hidden = !unifiedProfile.years;
  el("yearsPreview").textContent = unifiedProfile.years
    ? unifiedProfile.job + " · " + unifiedProfile.years
    : "";
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
    el("publishPost").disabled = Boolean(issues.length || incomplete);
    el("reviewStatus").textContent = issues.length
      ? "필수 수정 " + issues.length + "개 항목이 남았어요."
      : incomplete
        ? "제목과 본문 길이를 확인해 주세요."
        : "필수 점검을 통과했어요. 게시할 수 있어요.";
    const highlight = (field) => {
      let cursor = 0;
      let html = "";
      const hits = issues
        .flatMap((c) => c.matches)
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
    el("reviewResults").innerHTML = checks
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
      nick: unifiedProfile.nick,
      animal: unifiedProfile.animal,
      job: unifiedProfile.job,
      years: el("shareYears").checked ? unifiedProfile.years : "",
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
    originalIssues = new Map();
    showReviewResults(true);
    resumeDraft = true;
    el("editor").close();
    setupReviewDraft();
    renderReview();
    reviewDialog.showModal();
  };
  el("publishPost").onclick = () => {
    if (!pendingDraft) return;
    const p = {
      ...pendingDraft,
      title: pendingDraft.title.trim(),
      body: pendingDraft.body.trim(),
    };
    if (
      el("publishPost").disabled ||
      inspectDraft(p).some((c) => c.replacement && c.matches.length)
    )
      return;
    resumeDraft = false;
    pendingDraft = null;
    const previous = state.posts.findIndex((post) => post.id === editing);
    if (previous < 0) state.posts.unshift(p);
    else state.posts[previous] = p;
    save();
    reviewDialog.close();
    renderFeed();
    if (!el("personal").hidden) {
      tab = p.private ? "private" : "own";
      personal();
    }
    toast(
      previous < 0
        ? p.private
          ? "나만보기로 저장했어요."
          : "고민을 나눴어요."
        : "수정했어요.",
    );
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
      state.theme = theme;
      save();
      renderTheme();
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
}
