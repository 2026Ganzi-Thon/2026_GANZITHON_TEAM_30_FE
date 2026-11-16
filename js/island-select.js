/* 메인 선택 화면 전용 상태. 직무섬의 저장값은 읽기만 합니다. */
const islandSelectProfile=JSON.parse(localStorage.getItem('ondo-profile')||'null');
if(!islandSelectProfile||!sessionStorage.getItem('ondo-session'))location.replace('index.html');
const islandSelectVillage=JSON.parse(localStorage.getItem('ondo-village-v1')||'{"posts":[],"read":[]}');
const islandSelectUnified=JSON.parse(localStorage.getItem('ondo-unified-v1')||'{"posts":[],"read":[]}');
const islandSelectJobName=(islandSelectProfile?.job||'직무')+'섬';
const islandSelectItems=[
  {kind:'job',name:islandSelectJobName,path:'village.html',count:(islandSelectVillage.posts||[]).filter(post=>!post.private).length,alert:(islandSelectVillage.read||[]).length<2},
  {kind:'unified',name:'통합섬',path:'unified-island.html',count:(islandSelectUnified.posts||[]).filter(post=>!post.private).length,alert:(islandSelectUnified.read||[]).length<2}
];
let islandSelectIndex=0;const islandSelectCard=document.getElementById('island-select-card');
function islandSelectRender(){const item=islandSelectItems[islandSelectIndex];islandSelectCard.dataset.kind=item.kind;islandSelectCard.innerHTML=`<div class="island-select-art" role="img" aria-label="${item.name} 미리보기"></div><h2>${item.name}${item.alert?'<span class="island-select-alert">!</span>':''}</h2><p>${item.count?`최근 7일 고민 ${item.count}개`:'작성된 고민이 없어요!'}</p><button class="island-select-enter" id="island-select-enter">${item.name} 입장하기</button>`;document.querySelectorAll('[data-island-select-index]').forEach((button,index)=>button.setAttribute('aria-current',String(index===islandSelectIndex)));document.getElementById('island-select-enter').onclick=()=>location.assign(item.path)}
function islandSelectMove(delta){islandSelectIndex=(islandSelectIndex+delta+islandSelectItems.length)%islandSelectItems.length;islandSelectRender()}
document.getElementById('island-select-prev').onclick=()=>islandSelectMove(-1);document.getElementById('island-select-next').onclick=()=>islandSelectMove(1);document.querySelectorAll('[data-island-select-index]').forEach(button=>button.onclick=()=>{islandSelectIndex=Number(button.dataset.islandSelectIndex);islandSelectRender()});document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')islandSelectMove(-1);if(event.key==='ArrowRight')islandSelectMove(1)});islandSelectRender();
