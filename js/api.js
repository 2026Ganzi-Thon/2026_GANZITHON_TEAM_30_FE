const API = "https://ondo-api.onrender.com";

const CHARACTER_KEYS = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "sheep",
  "monkey",
  "rooster",
  "dog",
  "pig",
  "lion",
];

const COMFORT_KEYS = ["empathy", "experience", "opinion"];

// 캐릭터 색감(팔레트). 키는 BE의 CHARACTER_COLORS와 같고, 실제 색은 css의 .tone-키 필터
const CHARACTER_COLORS = [
  ["original", "기본"],
  ["warm", "노을빛"],
  ["forest", "숲빛"],
  ["ocean", "바다빛"],
  ["lavender", "라벤더"],
  ["pastel", "파스텔"],
  ["vivid", "선명하게"],
  ["mono", "흑백"],
];
// 12간지 × 위로 성향 페르소나. 캐릭터 성격에 맞춰 칭호 배지를 붙인다
const PERSONAS = {
  empathy: {
    icon: "💗",
    label: "무조건 공감형",
    animals: ["rabbit", "sheep", "pig", "dog"],
  },
  experience: {
    icon: "🧭",
    label: "실전 경험 조언형",
    animals: ["ox", "tiger", "horse", "dragon", "lion"],
  },
  opinion: {
    icon: "💡",
    label: "현실 솔루션형",
    animals: ["rat", "snake", "monkey", "rooster"],
  },
};
const personaKeyOf = (character) =>
  Object.keys(PERSONAS).find((key) => PERSONAS[key].animals.includes(character)) || null;
const personaOf = (character) => PERSONAS[personaKeyOf(character)] || null;
// 말풍선 배지 HTML (캐릭터 키는 서버가 검증한 값이라 그대로 써도 안전)
const personaBadge = (character) => {
  const key = personaKeyOf(character);
  return key
    ? `<span class="persona-badge persona-${key}" title="${PERSONAS[key].label}">${PERSONAS[key].icon} ${PERSONAS[key].label}</span>`
    : "";
};

const toneClass = (color) =>
  CHARACTER_COLORS.some(([key]) => key === color) && color !== "original"
    ? "tone-" + color
    : "";

// ── 로그인 정보 보관 ──
// "로그인 유지"를 체크하면 localStorage(서버 토큰 30일), 아니면 sessionStorage(브라우저를 닫으면 사라짐, 토큰 1일).
// 공용 PC에서 체크하지 않으면 창을 닫는 순간 토큰과 프로필(이메일 포함)이 남지 않는다.
const authStore = () => (localStorage.getItem("ondo-remember") === "1" ? localStorage : sessionStorage);
const authToken = () => authStore().getItem("ondo-token");
const loadProfile = () => {
  try {
    return JSON.parse(authStore().getItem("ondo-profile") || "null");
  } catch {
    return null;
  }
};
const saveProfile = (profile) => authStore().setItem("ondo-profile", JSON.stringify(profile));

function clearAuth() {
  for (const store of [localStorage, sessionStorage]) {
    for (const key of ["ondo-token", "ondo-profile", "ondo-session", "ondo-remember"]) store.removeItem(key);
  }
}

function startAuth(token, remember) {
  clearAuth();
  if (remember) localStorage.setItem("ondo-remember", "1");
  authStore().setItem("ondo-token", token);
  sessionStorage.setItem("ondo-session", "1");
}

// 예전 방식(유지 여부와 상관없이 localStorage에 저장)으로 남은 로그인 정보는 정리
if (localStorage.getItem("ondo-remember") !== "1") {
  localStorage.removeItem("ondo-token");
  localStorage.removeItem("ondo-profile");
}

function errorText(detail) {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        typeof item === "string" ? item : item?.msg || item?.message,
      )
      .filter(Boolean);
    return messages.join("\n") || "입력한 내용을 다시 확인해주세요.";
  }

  if (typeof detail === "string") return detail;

  return detail?.reason || detail?.message || "요청 처리에 실패했어요.";
}

async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  const token = authToken();

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(API + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해주세요.",
    );
  }

  if (response.status === 401 && auth) {
    clearAuth();
    location.href = "index.html";
    throw new Error("로그인이 만료됐어요. 다시 로그인해주세요.");
  }

  if (response.status === 204) return null;

  // 서버가 HTML 에러 페이지(콜드스타트 502 등)를 줘도 멈추지 않도록 처리
  let data = {};
  let isJson = true;
  try {
    data = await response.json();
  } catch {
    data = {};
    isJson = false;
  }

  if (!response.ok) {
    const error = new Error(errorText(data.detail));
    error.status = response.status;
    error.detail = data.detail;
    error.code = data.code;

    if (response.status === 429) {
      error.retryAfter = Number(response.headers.get("Retry-After")) || 60;
      error.message = `요청이 많아요. ${error.retryAfter}초 뒤 다시 시도해 주세요.`;
    } else if (response.status >= 502 && !isJson) {
      error.message = "서버가 깨어나는 중이에요. 잠시 뒤 다시 시도해 주세요.";
    }

    throw error;
  }

  return data;
}

async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch (error) {
    // 서버 로그아웃이 실패해도 이 브라우저의 로그인 정보는 제거
    console.error(error.message);
  } finally {
    clearAuth();
    location.replace("index.html");
  }
}
