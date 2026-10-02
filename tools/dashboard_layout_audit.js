// 대시보드 화면 구성 점검 — 긴 제목·주소가 든 가짜 데이터로 모든 화면·탭을 폭 360/430/768/1200px에서 돌려
// 가로 넘침·세로로 눌린 글자·세로로 긴 버튼·부모 밖으로 나간 요소를 찾는다. 실행: node tools/dashboard_layout_audit.js  (SHOTS=폴더 를 주면 전체 화면 캡처도 저장)
// playwright 는 이 환경의 전역 설치 경로를 쓴다(다른 기기에서는 require 경로를 바꿔야 함). 가짜 DB 는 tools/dashboard_smoke.js 와 같은 방식.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const STUB = `
(function(){
  var store={campaigns:{},items:{},templates:{},gear:{},trips:{},channels:{},links:{},celebs:{},keyword_picks:{},pickle_briefs:{},settings:{}};
  var subs=[]; window.__store=store; window.__calls=[];
  function docSnap(p){var a=p.split('/');var d=store[a[0]]&&store[a[0]][a[1]];return{exists:!!d,id:a[1],data:function(){return JSON.parse(JSON.stringify(d))}}}
  function collRes(c){var ids=Object.keys(store[c]||{});return{docs:ids.map(function(id){return{id:id,data:function(){return JSON.parse(JSON.stringify(store[c][id]))}}})}}
  function fire(c,p){subs.forEach(function(s){if(s.coll===c)s.cb(collRes(c));if(s.path===p)s.cb(docSnap(p))})}
  function docRef(p){return{onSnapshot:function(cb){subs.push({path:p,cb:cb});setTimeout(function(){cb(docSnap(p))},0);return function(){}},
    update:function(x){var a=p.split('/');store[a[0]][a[1]]=Object.assign({},store[a[0]][a[1]]||{},x);setTimeout(function(){fire(a[0],p)},0);return Promise.resolve()},
    set:function(x){var a=p.split('/');store[a[0]]=store[a[0]]||{};store[a[0]][a[1]]=JSON.parse(JSON.stringify(x));setTimeout(function(){fire(a[0],p)},0);return Promise.resolve()},
    delete:function(){return Promise.resolve()}}}
  function collRef(c){var q={orderBy:function(){return q},limit:function(){return q},onSnapshot:function(cb){subs.push({coll:c,cb:cb});setTimeout(function(){cb(collRes(c))},0);return function(){}}};return q}
  var db={doc:docRef,collection:collRef};
  var LONG='[서울 영등포] 아주아주긴업체이름을가진레스토랑앤카페 타임스퀘어점 본점 직영';
  var news=function(q){return {outlet_count:5,items:[1,2,3].map(function(i){return{title:q+' 관련 아주 긴 뉴스 제목이 여기에 들어갑니다 번호'+i+' 연예인 에르메스 789만원 가방 다이소 쇼핑 화제',description:'뉴스 요약 문장이 길게 이어집니다. 배우 누구누구가 최근 자신의 유튜브 채널에 올린 영상에서 가방을 들고 나와 화제가 되고 있다는 내용입니다...',link:'https://example.com/news/'+q+i+window.__calls.length,pubDate:'Thu, 01 Oct 2026 10:18:00 +0900',outlet:'sportschosun.com'}})}};
  var blogs=function(q){return {total:736007,items:[{title:'[알리딘서재] 명품 액세서리 미리보기(샤넬, 루이비통, 크리스챤디올)',description:'명품 액세서리 미리보기 블로그 글 앞부분 요약이 길게 이어집니다 ...',link:'https://blog.aladin.co.kr/'+window.__calls.length+'a',blogger:'https://blog.aladin.co.kr/',postdate:'20261001',readable:false},{title:'디올백 가격 인상 총정리 레이디디올 북토트 사이즈별 가격표 2026',description:'요약',link:'https://blog.naver.com/x/'+window.__calls.length+'b',blogger:'패션뷰티로그',postdate:'20260915',readable:true},{title:'오래된 글',description:'d',link:'https://blog.naver.com/x/'+window.__calls.length+'c',blogger:'옛블로거',postdate:'20040101',readable:true}]}};
  var mcp={callTool:function(s,t,i){window.__calls.push({s:s,t:t,i:i});
    if(t==='news_mentions')return Promise.resolve({payload:news(i.query)});
    if(t==='blog_search')return Promise.resolve({payload:blogs(i.query)});
    if(t==='blog_feed')return Promise.resolve({payload:{items:[]}});
    return Promise.resolve({payload:{keyword:i.q,total:77800,pc:1000,mobile:76800,pc_pct:1,mobile_pct:99,comp:'높음',period:'2026-09',trend:{icon:'📈',label:'상승',multiple:1.4,trust:'확실'},related:[{keyword:'디올가방',total:77800,comp:'높음'},{keyword:'디올백 가격 정리 아주긴연관키워드',total:9630,comp:'높음'},{keyword:'디올',total:5,under_10:true,comp:'낮음'}]}})}};
  var sample=function(prompt){return Promise.resolve({text:'{"topic":"t","emphasis":"e","twist":"w","title_bait":"b"}'})};
  window.claude={use:function(n){if(n==='db')return Promise.resolve(db);if(n==='mcp')return Promise.resolve(mcp);if(n==='sample')return Promise.resolve(sample);return Promise.resolve(null)}};
  var cats=['celeb_fashion','fashion_coord','travel_spot','costco_daiso','appliance','phone','travel_issue','ott','kurly_pick'];
  var labels={celeb_fashion:'연예인·명품',fashion_coord:'패션 코디',travel_spot:'명소·축제',costco_daiso:'코스트코·다이소',appliance:'가전·가구',phone:'핸드폰',travel_issue:'여행',ott:'OTT',kurly_pick:'컬리'};
  cats.forEach(function(c,i){
    ['pending','confirmed','posted'].forEach(function(st,j){
      store.items['i_'+c+'_'+st]={date:'2026-10-0'+(1+j),category_key:c,category:labels[c],topic:'아주 긴 주제 제목이 여기 들어갑니다 '+labels[c]+' 에르메스 다이소 789만원 '+st,emphasis:'강조 포인트 문장이 길게 이어집니다 강조 강조 강조',twist:'반전 포인트 문장',title_bait:'제목 후보가 꽤 길게 들어가는 경우 확인용 긴 문장입니다',main_keyword:'디올백',keyword_volume:77800,status:st,source_url:'https://example.com/a/very/long/url/that/should/not/break/layout/'+c,source_desc:'원본요약',source_title:'원본제목',origin:'news',draft_content:st==='pending'?'':'제목 라인\\n\\n본문 내용',related_news:[{title:'관련뉴스 제목이 길게',description:'d',link:'https://x.com/1',outlet:'x.com'}],needs_read:false,created_at:1+i};
    });
  });
  store.keyword_picks.k1={date:'2026-10-01',picks:cats.map(function(c,i){return{kw:'추천키워드'+i+'아주긴',category:labels[c],volume:12345,trend:'📈 상승',comp:'높음',earn:'수익 높음',note:'각도: 아주 긴 각도 제안 문장이 여기에 들어갑니다 길게길게',mode:'급등 우선'}})};
  store.pickle_briefs['2026-10-02']={date:'2026-10-02',promos:[{cat:'ott',title:'원패스워드, 크런치롤 사전예약',detail:'비밀번호 관리 프로그램, 원패스워드와 애니메이션 OTT 크런치롤의 사전예약을 접수하고 있어요!',commission:'커미션 최대 3만원',link:'https://pickle.plus/very/long/link/that/goes/on/and/on/forever/and/ever'},{cat:'phone',title:'아이폰 17 사전예약',detail:'상세',commission:'',link:''}],issues:[{cat:'ott',text:'넷플릭스 가격 인상 이슈 한두 문장 설명이 들어갑니다',q:'넷플릭스 가격'}],titles:[{name:'폭군의 셰프',platforms:'넷플릭스·티빙'}],keywords:[{cat:'ott',kws:['제미나이','제미나이 무료','제미나이 유료','제미나이 프로'],volume_claim:'월 검색량 1.6천만 건 이상',price_regular:'월 7,500원',price_pickle:'월 1,740원~',benefit:'최대 147만 원 할인'},{cat:'phone',kws:['아이폰17','갤럭시S26'],volume_claim:'',price_regular:'',price_pickle:'',benefit:''}],tips:['꿀팁 문장 https://pickle.plus/tips/very/long/url/without/spaces/that/can/break/layout/1234567890']};
  for(var i=0;i<8;i++){var st=['시작 전','예약 완료','방문 완료','글작성완료','블로그 포스팅 완료','진행안함','종료','예약 문의'][i];store.campaigns['c'+i]={name:LONG+i,status:st,platform:['강남맛집','레뷰','리뷰노트','디너의여왕'][i%4],created:'2026-09-2'+i,due:'2026-10-0'+(i+1),visit_date:i%2?'2026-10-10':null,visit_time:i%2?'12:30':null,amount:30000+i*1000,offer:'제공 내역이 길게 들어갑니다 줄바꿈\\n둘째 줄 정보 아주 길게 이어지는 문장',keywords:'키워드1, 키워드2',mission:'제목 1회 본문 3회 / 사진 15장',reserve_phone:'02-123-4567',draft_content:i>2?'제목\\n본문':'',prompt:'1️⃣ 제목\\n2️⃣ 핵심 키워드 : 영등포맛집',template:'s_food',types:['검색형'],received:'우동 정식',note:'메모',link:'https://example.com/campaign/very/long/link/'+i,auto_status:'done'}}
  store.templates.s_food={name:'맛집 검색형',group:'검색형',types:['맛집'],order:1,body:'1️⃣ 제목\\n5️⃣ 본문 구성\\n소주제'};
  store.templates.h_celeb={name:'연예인 홈피드',group:'홈피드형',types:['연예'],order:9,body:'5️⃣ 본문 구성\\n소주제'};
  store.celebs.a={name:'고소영',created_at:1};store.celebs.b={name:'아이유',created_at:2};
  store.settings.celeb_rank={updated_at:Date.now(),rows:[{name:'고소영',volume:5000,trend:'📈 상승'},{name:'이름이아주아주긴연예인',volume:123456,trend:''}],failed:[]};
  store.gear.g1={cat:'핸드폰',name:'아이폰16 프로 256GB',since:'2024년 10월부터',note:'배터리가 하루를 못 가요.',created_at:1};
  store.trips.t1={place:'교토',when:'2025년 4월',days:'3박4일',with:'혼자',stay:'가와라마치 호텔',spots:'후시미이나리',tip:'버스가 붐볐어요',created_at:1};
  store.channels.ch1={name:'엄미 매거진',cat:'연예인·명품',url:'https://www.instagram.com/very_long_account_name_that_goes_on/',created_at:1};
  store.links.l1={url:'https://www.instagram.com/p/ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/',cat:'핸드폰',memo:'캡션 메모가 길게 들어갑니다',status:'new',created_at:1};
})();`;
const WIDTHS=[360,430,768,1200];
const DETECT=`(function(){
  var vw=window.innerWidth, out=[];
  function path(e){var p=[];while(e&&e.nodeType===1&&p.length<4){var s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(e.className&&typeof e.className==='string')s+='.'+e.className.trim().split(/\\s+/).slice(0,2).join('.');p.unshift(s);e=e.parentElement}return p.join(' > ')}
  function visible(e){var r=e.getBoundingClientRect();if(!r.width&&!r.height)return false;var s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none'}
  function inScroller(e){var p=e.parentElement;while(p&&p!==document.body){var s=getComputedStyle(p);if(/(auto|scroll)/.test(s.overflowX)&&p.scrollWidth>p.clientWidth)return true;p=p.parentElement}return false}
  if(document.documentElement.scrollWidth>vw+1)out.push('PAGE-H-SCROLL scrollWidth='+document.documentElement.scrollWidth+' vw='+vw);
  var all=document.querySelectorAll('body *:not(script):not(style)');
  all.forEach(function(e){
    if(!visible(e))return;
    var r=e.getBoundingClientRect(), t=(e.childElementCount===0?e.textContent:'').trim();
    if((r.right>vw+1||r.left<-1)&&!inScroller(e))out.push('OFFSCREEN '+path(e)+' L'+Math.round(r.left)+' R'+Math.round(r.right)+(t?' "'+t.slice(0,25)+'"':''));
    if(t.length>=6&&r.width<45&&r.height>40)out.push('VERTICAL-TEXT '+path(e)+' w'+Math.round(r.width)+' h'+Math.round(r.height)+' "'+t.slice(0,25)+'"');
    var s=getComputedStyle(e);
    if(e.tagName==='BUTTON'&&t.length>=2&&r.height>60&&r.width<130)out.push('TALL-BUTTON '+path(e)+' w'+Math.round(r.width)+' h'+Math.round(r.height)+' "'+t.slice(0,20)+'"');
    if(e.children.length&&e.scrollWidth>e.clientWidth+2&&/(visible)/.test(s.overflowX)&&e.clientWidth>0&&!inScroller(e)&&r.right>vw-1)out.push('OVERFLOW-VISIBLE '+path(e)+' sw'+e.scrollWidth+' cw'+e.clientWidth);
    // 부모 상자를 넘치는 자식
    var par=e.parentElement; if(par&&par!==document.body&&/(INPUT|SELECT|TEXTAREA|OPTION)/.test(e.tagName)===false){var pr=par.getBoundingClientRect(); if(pr.width>0&&r.right>pr.right+3&&getComputedStyle(par).overflowX==='visible'&&getComputedStyle(par).display!=='inline'&&!inScroller(e)&&r.width>20)out.push('CHILD-OUT-OF-PARENT '+path(e)+' R'+Math.round(r.right)+' parentR'+Math.round(pr.right))}
  });
  return out.filter(function(x,i,a){return a.indexOf(x)===i}).slice(0,25);
})()`;
async function run(){
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',headless:true});
  const results={};
  for(const w of WIDTHS){
    const page=await browser.newPage({viewport:{width:w,height:900}});
    page.on('pageerror',e=>console.log('PAGEERROR',w,e.message));
    await page.addInitScript(STUB);
    await page.goto('file://'+path.resolve('dashboard/index.html'));
    await page.waitForTimeout(900);
    const scan=async(label,shot)=>{ const r=await page.evaluate(DETECT); if(r.length){(results[label]=results[label]||{})[w]=r;} if(shot&&process.env.SHOTS) await page.screenshot({path:process.env.SHOTS+'/'+label.replace(/[^a-z0-9가-힣]/gi,'_')+'_'+w+'.png',fullPage:true}); };
    await scan('home',true);
    // 홈: 추천 키워드 첫 줄 열기 + 연관 뉴스·블로그
    try{
      await page.click('#homeKw [data-pickkw]'); await page.waitForTimeout(500);
      await page.click('#homeKw [data-kwnews]'); await page.waitForTimeout(400);
      await page.click('#homeKw [data-kwblog]'); await page.waitForTimeout(400);
      await page.click('#homeKw .kw-rel [data-relnews]'); await page.waitForTimeout(400);
      await page.click('#homeKw .kw-rel [data-kwblog]'); await page.waitForTimeout(400);
    }catch(e){ console.log('home interact fail',w,e.message.split('\n')[0]); }
    await scan('home-열린키워드',true);
    await page.evaluate(()=>{location.hash='feed'}); await page.waitForTimeout(500);
    const tabs=['all','celeb_fashion','fashion_coord','travel_spot','costco_daiso','appliance','phone','travel_issue','ott','kurly_pick','done'];
    for(const t of tabs){
      await page.click('#tabs [data-cat="'+t+'"]'); await page.waitForTimeout(250);
      await page.evaluate(()=>{['newsFold','celebFold','pickleFold','toolsFold'].forEach(function(id){var e=document.getElementById(id);if(e&&!e.hidden)e.open=true})}); await page.waitForTimeout(150);
      await scan('feed-'+t,t==='all'||t==='ott'||t==='celeb_fashion');
      if(t==='ott'||t==='celeb_fashion'||t==='phone'){
        try{
          const q=await page.$('#newsBox [data-newsq]'); if(q){ await q.click(); await page.waitForTimeout(400); await scan('feed-'+t+'-뉴스결과',t==='ott'); }
          const bt=await page.$('[data-newstab="blog"]'); if(bt){ await bt.click(); await page.waitForTimeout(500); await scan('feed-'+t+'-블로그결과',t==='ott'); await page.click('[data-newstab="news"]'); }
          const pk=await page.$('#pickleBox [data-pickkw]'); if(pk){ await pk.click(); await page.waitForTimeout(400); const nb=await page.$('#pickleBox [data-kwnews]'); if(nb){await nb.click(); await page.waitForTimeout(400);} const bb=await page.$('#pickleBox [data-kwblog]'); if(bb){await bb.click(); await page.waitForTimeout(400);} await scan('feed-'+t+'-피클열림',t==='ott'); }
          if(t==='celeb_fashion'){ const ct=await page.$('[data-celebtopic]'); if(ct){ await ct.click(); await page.waitForTimeout(500); await scan('feed-celeb-뉴스보기',true); } }
        }catch(e){ console.log('interact fail',t,w,e.message.split('\n')[0]); }
      }
    }
    // 카드 편집
    await page.evaluate(()=>{location.hash='draft/i_celeb_fashion_confirmed'}); await page.waitForTimeout(700);
    await scan('editor',true);
    // 체험단
    await page.evaluate(()=>{location.hash='camp'}); await page.waitForTimeout(500);
    for(const st of ['urgent','active','booked','drafted','posted','closed','all']){ try{ await page.click('#campTabs [data-stage="'+st+'"]'); await page.waitForTimeout(200); await scan('camp-'+st,st==='active'); }catch(e){} }
    await page.evaluate(()=>{location.hash='camp/c1'}); await page.waitForTimeout(700); await scan('camp-detail',true);
    await page.evaluate(()=>{location.hash='camp/c3'}); await page.waitForTimeout(700); await scan('camp-detail-초안',true);
    await page.evaluate(()=>{location.hash='tpl'}); await page.waitForTimeout(500); await scan('tpl',false);
    await page.evaluate(()=>{location.hash='me'}); await page.waitForTimeout(500); await scan('me',true);
    await page.close();
  }
  await browser.close();
  // 요약: 같은 이슈를 라벨별로
  let n=0; for(const lab of Object.keys(results)){ console.log('\n## '+lab); for(const w of Object.keys(results[lab])){ console.log(' ['+w+'px]'); results[lab][w].forEach(x=>{console.log('   - '+x); n++;}); } }
  console.log('\nTOTAL findings',n);
}
run();
