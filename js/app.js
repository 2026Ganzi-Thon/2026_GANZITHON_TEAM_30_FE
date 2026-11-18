const byId = id => document.getElementById(id);
const names = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지','사자'];
const adjectives = [
  '느긋한', '다정한', '용감한', '포근한', '씩씩한', '졸린',
  '부지런한', '호기심 많은', '행복한', '상냥한', '차분한', '엉뚱한',
  '재치 있는', '명랑한', '수줍은', '유쾌한', '모험심 많은', '든든한',
  '꼼꼼한', '낙천적인', '정겨운', '발랄한', '온화한', '장난기 많은'
];
const nicknameHistory = new Map();
let animal = 2, verified = false, draft = {};
let saved = JSON.parse(localStorage.getItem('ondo-profile') || 'null');
function showAuth(mode) {
  const login = mode === 'login';
  byId('loginForm').hidden = !login;
  byId('infoTitle').hidden = login;
  byId('onboard').hidden = login;
  byId('showLogin').setAttribute('aria-selected', String(login));
  byId('showSignup').setAttribute('aria-selected', String(!login));
  byId('loginStatus').textContent = '';
}
function show(view) {
  for (const id of ['home','choose','done']) byId(id).hidden = id !== view;
  byId('account').hidden = view !== 'done';
  const heading = byId(view).querySelector('h1');
  heading.tabIndex = -1;
  heading.focus();
}

let nicknameRequest = 0;

async function recommend() {
  const requestId = ++nicknameRequest;
  const nick = byId('nick');
  const submit = byId('profile').querySelector('button.wide');

  nick.readOnly = true;
  nick.maxLength = 40;
  nick.value = '';
  nick.placeholder = '닉네임을 추천받고 있어요...';
  submit.disabled = true;

  try {
    const result = await api(
      `/auth/nickname?character=${CHARACTER_KEYS[animal]}`,
      { auth: false }
    );

    if (requestId !== nicknameRequest) return;

    nick.setCustomValidity('');
    nick.value = result.nickname;
    submit.disabled = false;
  } catch (error) {
    if (requestId !== nicknameRequest) return;

    nick.placeholder = '다시 추첨하기를 눌러주세요.';
    alert(error.message);
  }
}

const jobIcons = {
  '디자인': 'design',
  '개발': 'development',
  '마케팅': 'marketing',
  '영업': 'marketing'
};
function select(index, refreshNick = true) {
  animal = (index + names.length) % names.length;
  const icon = jobIcons[draft.job];
  const cards = byId('cards');
  cards.replaceChildren();
  for (const offset of [-1, 0, 1]) {
    const choice = (animal + offset + names.length) % names.length;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'character-card';
    card.setAttribute('aria-label', names[choice]);
    card.setAttribute('aria-pressed', offset === 0);
    const iconSlot = document.createElement('span');
    iconSlot.className = 'job-icon';
    if (icon) {
      const badge = new Image();
      badge.src = 'assets/jobs/' + icon + '.png';
      badge.alt = draft.job;
      iconSlot.append(badge);
    }
    const animalImage = new Image();
    animalImage.className = 'character-image';
    animalImage.src = 'assets/characters/' + choice + '.png';
    animalImage.alt = '';
    const base = document.createElement('span');
    base.className = 'character-base';
    card.append(iconSlot, base, animalImage);
    card.onclick = () => {
      if (offset) select(choice);
      cards.children[1].focus();
    };
    cards.append(card);
  }
  byId('animalName').textContent = names[animal];
  if (refreshNick) recommend();
}
byId('previous').onclick = () => select(animal - 1);
byId('next').onclick = () => select(animal + 1);
byId('animals').onkeydown = event => {
  const offset = {ArrowLeft: -1, ArrowRight: 1}[event.key];
  if (!offset) return;
  event.preventDefault();
  select(animal + offset);
  byId('cards').children[1].focus();
};
let swipeStart;
byId('cards').addEventListener('touchstart', event => {
  swipeStart = event.changedTouches[0].clientX;
}, {passive:true});
byId('cards').addEventListener('touchend', event => {
  const delta = event.changedTouches[0].clientX - swipeStart;
  if (Math.abs(delta) > 45) select(animal + (delta < 0 ? 1 : -1));
}, {passive:true});
for (const id of ['job','years']) {
  const select = byId(id);
  const picker = document.createElement('details');
  picker.className = 'info-picker';
  picker.name = 'onboard-pickers';
  const trigger = document.createElement('summary');
  trigger.id = id + 'Choice';
  trigger.setAttribute('aria-labelledby', id + 'Label ' + trigger.id);
  trigger.textContent = '선택해주세요';
  const choices = document.createElement('div');
  choices.className = 'info-choices';
  for (const option of select.options) {
    if (id === 'job' && !option.value) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.textContent;
    button.setAttribute('aria-pressed','false');
    button.onclick = () => {
      select.value = option.value;
      trigger.textContent = option.textContent;
      for (const choice of choices.children) choice.setAttribute('aria-pressed', choice === button);
      picker.open = false;
      trigger.focus();
      updateVerification();
    };
    choices.append(button);
  }
  picker.append(trigger, choices);
  select.after(picker);
  function positionChoices() {
    if (!picker.open) return;
    const {left, bottom, width} = trigger.getBoundingClientRect();
    const top = bottom + 6;
    Object.assign(choices.style, {
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      maxHeight: Math.max(0, document.documentElement.clientHeight - top - 8) + 'px'
    });
  }
  picker.addEventListener('toggle', positionChoices);
  byId('info').addEventListener('scroll', positionChoices, {passive:true});
  window.addEventListener('resize', positionChoices);
  picker.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !picker.open) return;
    event.preventDefault();
    picker.open = false;
    trigger.focus();
  });
}

let verificationTimer;
let resendUntil = 0;
let sendingCode = false;
let codeEmail = '';

function updateVerification() {
  const email = byId('email').value.trim().toLowerCase();
  const remaining = Math.max(
    0,
    Math.ceil((resendUntil - Date.now()) / 1000)
  );

  byId('verify').disabled =
    !byId('email').validity.valid || sendingCode || remaining > 0;

  byId('verify').textContent = sendingCode
    ? '요청 중...'
    : remaining > 0
      ? `재전송 (${remaining}초)`
      : verified
        ? '인증코드 다시 받기'
        : '인증 메일 받기';

  byId('continue').disabled =
    !verified ||
    email !== codeEmail ||
    !/^[0-9]{6}$/.test(byId('signupCode').value.trim()) ||
    !byId('job').value ||
    !byId('agreePrivacy').checked;
}

byId('email').oninput = () => {
  verified = false;
  codeEmail = '';
  byId('signupCode').value = '';
  byId('status').hidden = true;
  updateVerification();
};

byId('signupCode').oninput = updateVerification;
byId('agreePrivacy').onchange = updateVerification;

byId('showLogin').onclick = () => showAuth('login');
byId('showSignup').onclick = () => showAuth('signup');
byId('start').onclick = () => { updateVerification(); showAuth(saved ? 'login' : 'signup'); byId('info').showModal(); };
byId('close').onclick = () => byId('info').close();
let loginResendUntil = 0;
let loginCodeTimer;
let loginSending = false;

function updateLoginCodeButton() {
  const remaining = Math.max(
    0,
    Math.ceil((loginResendUntil - Date.now()) / 1000)
  );

  byId('loginSendCode').disabled = loginSending || remaining > 0;
  byId('loginSendCode').textContent = loginSending
    ? '요청 중...'
    : remaining > 0
      ? `재전송 (${remaining}초)`
      : '로그인 인증코드 받기';
}

byId('loginEmail').oninput = () => {
  byId('loginCode').value = '';
  byId('loginStatus').textContent = '';
};

byId('loginSendCode').onclick = async () => {
  if (!byId('loginEmail').reportValidity()) return;

  const email = byId('loginEmail').value.trim().toLowerCase();

  loginSending = true;
  byId('loginCode').value = '';
  byId('loginStatus').textContent = '인증코드를 요청하고 있어요.';
  updateLoginCodeButton();

  try {
    const result = await api('/auth/email-code', {
      method: 'POST',
      auth: false,
      body: { email, purpose: 'login' }
    });

    loginResendUntil = Date.now() + result.resend_after * 1000;

    clearInterval(loginCodeTimer);
    loginCodeTimer = setInterval(() => {
      updateLoginCodeButton();

      if (Date.now() >= loginResendUntil) {
        clearInterval(loginCodeTimer);
      }
    }, 1000);

    if (byId('loginEmail').value.trim().toLowerCase() !== email) return;

    byId('loginStatus').textContent = result.demo_code
      ? `체험용 인증코드: ${result.demo_code} (5분 동안 유효)`
      : '이메일로 인증코드를 보냈어요.';

    byId('loginCode').focus();
  } catch (error) {
    byId('loginStatus').textContent = error.message;
  } finally {
    loginSending = false;
    updateLoginCodeButton();
  }
};

byId('loginForm').onsubmit = async event => {
  event.preventDefault();

  const submit = byId('loginSubmit');
  if (submit.disabled) return;

  submit.disabled = true;
  submit.textContent = '로그인 중...';

  try {
    const result = await api('/auth/login', {
      method: 'POST',
      auth: false,
      body: {
        email: byId('loginEmail').value.trim().toLowerCase(),
        code: byId('loginCode').value.trim()
      }
    });

    localStorage.setItem('ondo-token', result.access_token);

    const me = await api('/auth/me');

    // 기존 화면이 사용하는 이름으로 변환해 보관
    saved = {
      id: me.id,
      email: me.email,
      job: me.job,
      years: me.years || '',
      nick: me.nickname,
      animal: CHARACTER_KEYS.indexOf(me.character)
    };

    localStorage.setItem('ondo-profile', JSON.stringify(saved));
    sessionStorage.setItem('ondo-session', '1');

    location.href = 'island-select.html';
  } catch (error) {
    byId('loginStatus').textContent = error.message;
  } finally {
    submit.disabled = false;
    submit.textContent = '로그인';
  }
};

byId('verify').onclick = async () => {
  if (!byId('email').reportValidity()) return;

  const email = byId('email').value.trim().toLowerCase();

  sendingCode = true;
  verified = false;
  codeEmail = '';
  byId('signupCode').value = '';
  byId('status').hidden = false;
  byId('status').textContent = '인증코드를 요청하고 있어요.';
  updateVerification();

  try {
    const result = await api('/auth/email-code', {
      method: 'POST',
      auth: false,
      body: { email, purpose: 'signup' }
    });

    resendUntil = Date.now() + result.resend_after * 1000;

    clearInterval(verificationTimer);
    verificationTimer = setInterval(() => {
      updateVerification();

      if (Date.now() >= resendUntil) {
        clearInterval(verificationTimer);
        verificationTimer = null;
      }
    }, 1000);

    // 요청 중 이메일을 변경했다면 이전 이메일의 코드를 사용하지 않음
    if (byId('email').value.trim().toLowerCase() !== email) return;

    codeEmail = email;
    verified = true;
    byId('status').hidden = false;
    byId('status').textContent = result.demo_code
      ? `체험용 인증코드: ${result.demo_code} (5분 동안 유효)`
      : '이메일로 인증코드를 보냈어요. 5분 안에 입력해주세요.';

    byId('signupCode').focus();
  } catch (error) {
    byId('status').hidden = false;
    byId('status').textContent = error.message;
  } finally {
    sendingCode = false;
    updateVerification();
  }
};

byId('onboard').onsubmit = event => {
  event.preventDefault();

  const email = byId('email').value.trim().toLowerCase();
  const code = byId('signupCode').value.trim();

  if (
    !verified ||
    email !== codeEmail ||
    !/^[0-9]{6}$/.test(code) ||
    !byId('job').value ||
    !byId('agreePrivacy').checked
  ) return;

  draft = {
    email,
    code,
    job: byId('job').value,
    years: byId('years').value,
    agree_privacy: byId('agreePrivacy').checked
  };

  byId('info').close();
  select(2);
  show('choose');
};


function welcome() {
  byId('doneAnimal').src = 'assets/characters/' + saved.animal + '.png';
  byId('greeting').textContent = saved.nick + '님, ON-DO에 오신 걸 환영해요!';
  byId('details').textContent = [saved.job, saved.years].filter(Boolean).join(' · ');
  sessionStorage.setItem('ondo-session', '1');
  show('done');
}
byId('shuffle').onclick = recommend;
byId('nick').oninput = () => byId('nick').setCustomValidity('');
byId('profile').onsubmit = async event => {
  event.preventDefault();

  const nickname = byId('nick').value.trim();
  const submit = byId('profile').querySelector('button.wide');

  if (!nickname || submit.disabled) return;

    // 이미 가입한 사람이 수정하러 들어온 경우 → 가입이 아니라 프로필 수정
  if (!draft.code) {
    submit.disabled = true;
    submit.textContent = '저장 중...';
    try {
      const updated = await api('/users/me', {
        method: 'PATCH',
        body: { character: CHARACTER_KEYS[animal], nickname }
      });
      saved = { ...saved, nick: updated.nickname, animal: CHARACTER_KEYS.indexOf(updated.character) };
      localStorage.setItem('ondo-profile', JSON.stringify(saved));
      welcome();
    } catch (error) {
      alert(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = '입력 완료';
    }
    return;
  }

  submit.disabled = true;
  submit.textContent = '가입 중...';

  try {
    await api('/auth/signup', {
      method: 'POST',
      auth: false,
      body: {
        email: draft.email,
        code: draft.code,
        job: draft.job,
        years: draft.years || null,
        character: CHARACTER_KEYS[animal],
        nickname,
        agree_privacy: draft.agree_privacy
      }
    });

    const email = draft.email;
    draft = {};
    verified = false;
    codeEmail = '';

    byId('signupCode').value = '';
    byId('agreePrivacy').checked = false;
    byId('status').hidden = true;

    show('home');
    showAuth('login');
    byId('loginEmail').value = email;
    byId('info').showModal();

    alert('회원가입이 완료됐어요! 이어서 로그인해주세요.');
  } catch (error) {
    alert(error.message);
  } finally {
    submit.disabled = false;
    submit.textContent = '입력 완료';
  }
};
byId('edit').onclick = () => {
  draft = {email:saved.email, job:saved.job, years:saved.years};
  select(saved.animal, false);
  byId('nick').value = saved.nick;
  show('choose');
};
byId('account').onclick = logout;

if (saved && localStorage.getItem('ondo-token') && sessionStorage.getItem('ondo-session')) welcome();
