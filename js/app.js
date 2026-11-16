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
function show(view) {
  for (const id of ['home','choose','done']) byId(id).hidden = id !== view;
  byId('account').hidden = view !== 'done';
  const heading = byId(view).querySelector('h1');
  heading.tabIndex = -1;
  heading.focus();
}
function recommend() {
  const nick = byId('nick');
  const suffix = ' ' + names[animal];
  let used = nicknameHistory.get(animal);
  if (!used || used.size === adjectives.length) {
    used = new Set();
    nicknameHistory.set(animal, used);
  }
  const candidates = adjectives.filter(word => !used.has(word));
  const alternatives = candidates.filter(word => word + suffix !== nick.value.trim());
  const pool = alternatives.length ? alternatives : candidates;
  const word = pool[Math.floor(Math.random() * pool.length)];
  used.add(word);
  nick.setCustomValidity('');
  nick.value = word + suffix;
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
function updateVerification() {
  byId('continue').disabled = !verified || !byId('job').value;
  byId('verify').disabled = !byId('email').validity.valid || verified || Boolean(verificationTimer);
  byId('verify').textContent = verified ? '인증 완료되었습니다!' : verificationTimer ? '인증 중입니다 ...' : '인증 메일 받기';
  byId('verify').classList.toggle('email-ready', verified || Boolean(verificationTimer));
  byId('status').hidden = !verified;
  byId('status').textContent = verified ? '체험용 인증이 완료됐어요.' : '';
}
byId('email').oninput = () => {
  clearTimeout(verificationTimer);
  verificationTimer = null;
  verified = false;
  updateVerification();
};
byId('start').onclick = () => { updateVerification(); byId('info').showModal(); };
byId('close').onclick = () => byId('info').close();
byId('verify').onclick = () => {
  if (!byId('email').reportValidity()) return;
  verificationTimer = setTimeout(() => {
    verificationTimer = null;
    verified = true;
    updateVerification();
  }, 450);
  updateVerification();
};
byId('onboard').onsubmit = event => {
  event.preventDefault();
  if (!verified || !byId('job').value) return;
  draft = {job:byId('job').value, years:byId('years').value};
  byId('info').close();
  byId('email').value = '';
  verified = false;
  updateVerification();
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
byId('profile').onsubmit = event => {
  event.preventDefault();
  const nick = byId('nick').value.trim();
  if (!nick) {
    byId('nick').setCustomValidity('닉네임을 입력해주세요.');
    byId('nick').reportValidity();
    return;
  }
  saved = {...draft, animal, nick};
  localStorage.setItem('ondo-profile', JSON.stringify(saved));
  welcome();
};
byId('edit').onclick = () => {
  draft = {job:saved.job, years:saved.years};
  select(saved.animal, false);
  byId('nick').value = saved.nick;
  show('choose');
};
byId('account').onclick = () => {sessionStorage.removeItem('ondo-session');show('home');};
if (saved && sessionStorage.getItem('ondo-session')) welcome();
