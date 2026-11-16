const reviewRules = [
  {label:'회사·조직명 노출',action:'회사명 가리기',pattern:/(?:\(주\)|㈜|주식회사\s*)[가-힣A-Za-z0-9]+|[가-힣A-Za-z0-9]{2,}(?:소프트|테크|컴퍼니|코퍼레이션)(?=에서|의|에|\s|$)/gu,replacement:'회사'},
  {label:'실명·직책 등 신원 정보',action:'실명 지우기',pattern:/(?<![가-힣])([김이박최정강조윤장임한오서신권황안송류홍][가-힣]{2})\s*(팀장님?|부장님?|과장님?|대리님?|대표님?|매니저님?|씨)(?=\s|[은는이가을를에게께도,.]|$)/gu,replacement:'$2'},
  {label:'상대를 향한 비방·단정 표현',action:'단정 표현 바꾸기',pattern:/무능한 것 같아요|무능해요|멍청해요|(?:저|그) 사람은 쓰레기예요|팀장님은 정말 무능한 것 같아요/gu,replacement:'함께 일하는 과정이 어렵게 느껴져요'},
  {label:'연락처·주민등록번호',action:'개인정보 가리기',pattern:/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?<!\d)(?:01[016789][ -]?\d{3,4}[ -]?\d{4}|\d{6}[- ]?[1-8]\d{6})(?!\d)/giu,replacement:'[비공개]'},
  {label:'자해·위험 신호',pattern:/죽고\s*싶|자해하고\s*싶|목숨을\s*끊고\s*싶|스스로를\s*해치고\s*싶/gu,note:'지금 안전이 걱정된다면 가까운 사람이나 응급 서비스에 바로 도움을 요청해 주세요.'}
];
function inspectDraft(draft) {
  return reviewRules.map(rule=>({
    ...rule,
    matches:['title','body'].flatMap(field=>
      [...draft[field].matchAll(rule.pattern)].map(match=>({field,text:match[0],index:match.index}))
    )
  }));
}
function applyReviewRule(draft,rule) {
  return {...draft,title:draft.title.replace(rule.pattern,rule.replacement),body:draft.body.replace(rule.pattern,rule.replacement)};
}
