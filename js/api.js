const API = 'http://localhost:8000';

const CHARACTER_KEYS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse',
  'sheep', 'monkey', 'rooster', 'dog', 'pig', 'lion'
];

const COMFORT_KEYS = ['empathy', 'experience', 'opinion'];

function errorText(detail) {
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg).join('\n');
  }

  if (typeof detail === 'string') return detail;

  return detail?.reason || detail?.message || '요청 처리에 실패했어요.';
}

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  const token = localStorage.getItem('ondo-token');

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(API + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error('서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해주세요.');
  }

  if (response.status === 401 && auth) {
    localStorage.removeItem('ondo-token');
    localStorage.removeItem('ondo-profile');
    sessionStorage.removeItem('ondo-session');
    location.href = 'index.html';
    throw new Error('로그인이 만료됐어요. 다시 로그인해주세요.');
  }

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(errorText(data.detail));
    error.status = response.status;
    error.detail = data.detail;
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
    localStorage.removeItem("ondo-token");
    localStorage.removeItem("ondo-profile");
    sessionStorage.removeItem("ondo-session");
    location.replace("index.html");
  }
}