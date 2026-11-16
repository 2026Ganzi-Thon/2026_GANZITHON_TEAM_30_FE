/* 메인 선택 화면 전용 상태. 팀 로그인 화면의 ondo-profile 값은 읽기만 합니다. */
const islandSelectProfile = JSON.parse(localStorage.getItem('ondo-profile') || 'null') || { job: '직무' };
const islandSelectItems = [
  { kind: 'unified', name: '통합섬', path: 'unified-island.html' },
  { kind: 'job', name: `${islandSelectProfile.job}섬`, path: 'village.html' },
];

const islandSelectJobMessages = {
  디자인: '디자이너 이웃들의 이야기를 만나요.',
  영업: '영업직 이웃들의 이야기를 만나요.',
  개발: '개발, 엔지니어링 이웃들의 이야기를 만나요.',
};

let islandSelectIndex = 0;
const islandSelectCard = document.getElementById('island-select-card');
const islandSelectCarousel = document.querySelector('.island-select-carousel');
const islandSelectTitle = document.getElementById('island-select-title');
const islandSelectSubtitle = document.querySelector('.island-select-stage > p');

function islandSelectArt(item) {
  return item.kind === 'unified' ? 'assets/islands/unified-island.png' : 'assets/islands/job-island.png';
}

function islandSelectPreviewMessage(item) {
  if (item.kind === 'unified') return '다양한 사람들의 이야기를 만나요.';
  return islandSelectJobMessages[islandSelectProfile.job] || `${islandSelectProfile.job} 이웃들의 이야기를 만나요.`;
}

function islandSelectShowPreview(item) {
  islandSelectCarousel.classList.add('is-preview');
  islandSelectCarousel.dataset.kind = item.kind;
  islandSelectCard.dataset.kind = item.kind;
  islandSelectTitle.textContent = '오늘의 고민은 무엇인가요?';
  islandSelectSubtitle.textContent = islandSelectPreviewMessage(item);
  islandSelectCard.innerHTML = `
    <img class="island-select-preview-art" src="${islandSelectArt(item)}" alt="${item.name}">
    <button class="island-select-browse" id="island-select-browse">고민 둘러보기</button>
  `;
  document.getElementById('island-select-browse').onclick = () => location.assign(item.path);
}

function islandSelectRender() {
  const item = islandSelectItems[islandSelectIndex];
  islandSelectCarousel.classList.remove('is-preview');
  islandSelectCarousel.dataset.kind = item.kind;
  islandSelectCard.dataset.kind = item.kind;
  islandSelectTitle.textContent = '어느 섬으로 갈까요?';
  islandSelectSubtitle.textContent = '두 섬을 둘러보고, 마음이 가는 곳으로 떠나보세요.';
  islandSelectCard.innerHTML = `
    <img class="island-select-art" src="${islandSelectArt(item)}" alt="${item.name} 미리보기">
    <img class="island-select-route" src="assets/islands/route-line.png" alt="">
    <img class="island-select-boat" src="assets/islands/route-boat.png" alt="">
    <div class="island-select-copy">
      <h2>${item.name}</h2>
      <p>${item.kind === 'unified' ? '다양한 직무의 이웃들과 고민을 나눠요.' : islandSelectPreviewMessage(item)}</p>
      <button class="island-select-enter" id="island-select-enter">${item.name} 입장하기</button>
    </div>
  `;
  document.getElementById('island-select-prev').disabled = islandSelectIndex === 0;
  document.getElementById('island-select-next').disabled = islandSelectIndex === islandSelectItems.length - 1;
  document.getElementById('island-select-enter').onclick = () => islandSelectShowPreview(item);
}

function islandSelectMove(delta) {
  const next = islandSelectIndex + delta;
  if (next < 0 || next >= islandSelectItems.length) return;
  islandSelectIndex = next;
  islandSelectRender();
}

document.getElementById('island-select-prev').onclick = () => islandSelectMove(-1);
document.getElementById('island-select-next').onclick = () => islandSelectMove(1);
islandSelectRender();
