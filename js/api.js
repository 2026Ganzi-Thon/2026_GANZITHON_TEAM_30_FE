const USE_MOCK=true; const BASE_URL='/api/v1'; // TODO(BE): API 전환 지점
const commonKey='ondo-common-v1';
const commonStore=()=>{const saved=JSON.parse(localStorage.getItem(commonKey)||'null');if(saved)return saved;const value={posts:ONDO_COMMON_SEED,notifications:[{id:'notice-1',title:'상사 피드백을 들으면 겁부터 나요',read:false}]};localStorage.setItem(commonKey,JSON.stringify(value));return value};
const persist=value=>localStorage.setItem(commonKey,JSON.stringify(value));
// TODO(BE): GET /api/v1/islands/8/posts
async function getIslandPosts(){return commonStore().posts}
// TODO(BE): POST /api/v1/posts
async function createPost(post){const store=commonStore();store.posts.unshift(post);persist(store);return post}
// TODO(BE): POST /api/v1/islands/8/search
async function searchSimilar(query){const q=query.toLowerCase().split(/\s+/).filter(Boolean);return commonStore().posts.filter(p=>q.some(w=>(p.title+p.body+p.topic).toLowerCase().includes(w)))}
