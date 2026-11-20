// 고민 피드 목록
// (island-core.js에서 분리. 모든 island/*.js는 전역 스코프를 공유하는 일반 스크립트라 HTML의 로드 순서가 중요합니다)

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
          <strong>${post.waiting ? '<span class="waiting-badge">답을 기다려요</span>' : ""}${escapeText(post.title)}</strong>
          <small>${escapeText(post.author?.nickname || "떠난 이용자")} ${(post.author?.title?.tier || 0) >= 3 ? titleBadge(post.author.title, { compact: true }) : ""}</small>
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
