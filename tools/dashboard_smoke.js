// 대시보드 스모크 테스트 — window.claude 를 가짜로 꽂고 필터·예약 필요 탭·캘린더 등록 흐름을 돌려본다.
// 실행: npm i playwright@1.63.0 (한 번) → node tools/dashboard_smoke.js dashboard/index.html  (크로미움: /opt/pw-browsers/chromium 또는 로컬 설치)
const { chromium } = require('playwright');
const path = require('path');

const STUB = `
(function(){
  var store = { campaigns: {}, items: {}, templates: {}, gear: {}, trips: {}, channels: {}, links: {}, celebs: {}, keyword_picks: {}, settings: {} };
  var subs = [];   // {coll, cb} or {path, cb}
  window.__store = store; window.__calls = [];
  function docSnap(path){ var [coll, id] = path.split('/'); var d = store[coll] && store[coll][id]; return { exists: !!d, id: id, data: function(){ return Object.assign({}, d); } }; }
  function collRes(coll){ var ids = Object.keys(store[coll] || {}); return { docs: ids.map(function(id){ return { id: id, data: function(){ return Object.assign({}, store[coll][id]); } }; }) }; }
  function fire(coll, path){ subs.forEach(function(s){ if(s.coll === coll) s.cb(collRes(coll)); if(s.path === path) s.cb(docSnap(path)); }); }
  function docRef(path){
    return {
      onSnapshot: function(cb){ subs.push({ path: path, cb: cb }); setTimeout(function(){ cb(docSnap(path)); }, 0); return function(){}; },
      update: function(p){ var [coll, id] = path.split('/'); store[coll][id] = Object.assign({}, store[coll][id] || {}, p); setTimeout(function(){ fire(coll, path); }, 0); return Promise.resolve(); },
      set: function(p){ var [coll, id] = path.split('/'); store[coll] = store[coll] || {}; store[coll][id] = Object.assign({}, p); setTimeout(function(){ fire(coll, path); }, 0); return Promise.resolve(); },
      delete: function(){ var [coll, id] = path.split('/'); delete store[coll][id]; setTimeout(function(){ fire(coll, path); }, 0); return Promise.resolve(); }
    };
  }
  function collRef(coll){
    var q = { orderBy: function(){ return q; }, limit: function(){ return q; },
      onSnapshot: function(cb){ subs.push({ coll: coll, cb: cb }); setTimeout(function(){ cb(collRes(coll)); }, 0); return function(){}; } };
    return q;
  }
  var db = { doc: docRef, collection: collRef };
  var mcp = {
    callTool: function(server, tool, input, opts){ window.__calls.push({ server: server, tool: tool, input: input }); return Promise.resolve({ payload: { id: 'evt123', htmlLink: 'https://calendar.google.com/event?eid=evt123' } }); },
    listTools: function(){ return Promise.resolve({ servers: [] }); }
  };
  window.claude = { use: function(name){ if(name === 'db') return Promise.resolve(db); if(name === 'mcp') return Promise.resolve(mcp); return Promise.resolve(null); } };
  store.campaigns.A = { name: '[서울 영등포] 왕가네칼국수', platform: '강남맛집', status: '시작 전', created: '2026-09-20', due: '2026-10-05', reserve_phone: '02-123-4567', auto_status: 'done', note: '닭볶음탕1 + 바지락칼국수1 체험권', link: 'https://example.com/a' };
  store.campaigns.B = { name: '[경기 부천] 네일쁨', platform: '리뷰노트', status: '예약 완료', created: '2026-10-01', visit_date: '2026-10-10', visit_time: '12:30', due: '2026-10-20', reserve_phone: '010-0000-0000', photo_folder: 'https://drive.google.com/x', note: '글리터 네일', link: 'https://www.reviewnote.co.kr/campaigns/1' };
  store.campaigns.C = { name: '[서울] 지난방문', platform: '레뷰', status: '예약 완료', created: '2026-08-15', visit_date: '2026-09-01', visit_time: '12:00', due: '2026-09-10' };
})();
`;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if(m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.addInitScript(STUB);
  const file = 'file://' + path.resolve(process.argv[2]);
  await page.goto(file + '#camp');
  await page.waitForTimeout(600);
  const fails = [];
  const check = (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' :: ' + extra : '')); if(!ok) fails.push(name); };


  // 0) 필터: 전체 탭 + 플랫폼 / 등록월
  await page.click('#campTabs [data-stage="all"]');
  await page.waitForTimeout(150);
  let n = await page.$$eval('#campList .c-card', els => els.length);
  check('전체 탭 3건', n === 3, 'n=' + n);
  await page.selectOption('#campFilters select[data-f="platform"]', '리뷰노트');
  await page.waitForTimeout(150);
  let fn = await page.$$eval('#campList .c-card .c-name', els => els.map(e => e.textContent));
  check('플랫폼 필터', fn.length === 1 && /네일쁨/.test(fn[0]), fn.join('|'));
  check('필터 건수 표시', /1건 \(전체 3\)/.test(await page.$eval('#campFilterCount', e => e.textContent)), await page.$eval('#campFilterCount', e => e.textContent));
  await page.click('#campFilterReset');
  await page.waitForTimeout(150);
  await page.selectOption('#campFilters select[data-f="month"]', '2026-09');
  await page.waitForTimeout(150);
  fn = await page.$$eval('#campList .c-card .c-name', els => els.map(e => e.textContent));
  check('등록월 필터 9월', fn.length === 1 && /왕가네/.test(fn[0]), fn.join('|'));
  await page.selectOption('#campFilters select[data-f="monthBy"]', 'visit');
  await page.waitForTimeout(150);
  const mOpts = await page.$$eval('#campFilters select[data-f="month"] option', els => els.map(e => e.value));
  check('방문월 기준으로 선택지 교체', mOpts.indexOf('2026-10') >= 0 && mOpts.indexOf('2026-09') >= 0 && mOpts.indexOf('2026-08') < 0, mOpts.join(','));
  await page.selectOption('#campFilters select[data-f="month"]', '2026-09');
  await page.waitForTimeout(150);
  fn = await page.$$eval('#campList .c-card .c-name', els => els.map(e => e.textContent));
  check('방문월 9월 = C', fn.length === 1 && /지난방문/.test(fn[0]), fn.join('|'));
  await page.click('#campFilterReset');
  await page.waitForTimeout(150);
  check('필터 지우기 후 3건', (await page.$$eval('#campList .c-card', els => els.length)) === 3);

  // 1) 예약 필요 탭
  const tabs = await page.$$eval('#campTabs .tab', els => els.map(e => e.textContent));
  check('예약 필요 탭 존재', tabs.some(t => t.indexOf('📞 예약 필요') === 0), tabs.join(' | '));
  await page.click('#campTabs [data-stage="reserve"]');
  await page.waitForTimeout(200);
  const names = await page.$$eval('#campList .c-card .c-name', els => els.map(e => e.textContent));
  check('예약 필요 탭에 A만', names.length === 1 && names[0].indexOf('왕가네칼국수') >= 0, names.join(' | '));
  check('문자 문구 복사 버튼', !!(await page.$('#campList [data-sms]')));
  check('전화 링크', !!(await page.$('#campList a[href="tel:021234567"]')));
  // 문자 문구 복사: 클립보드 대신 copyText 가 만든 textarea 값을 가로챈다
  await page.evaluate(() => { const orig = document.body.appendChild.bind(document.body); window.__copied = null; document.body.appendChild = function(el){ if(el.tagName === 'TEXTAREA' && el.style.opacity === '0') window.__copied = el.value; return orig(el); }; });
  await page.click('#campList [data-sms]');
  await page.waitForTimeout(200);
  const copied = await page.evaluate(() => window.__copied);
  check('문자 문구', copied === '안녕하세요. 왕가네칼국수 사장님 체험단 선정된 김은아라고 합니다. ○월 ○일 ○시에 방문해도 될까요??', copied);

  // 2) B 상세 → 캘린더 등록 버튼 → create_event
  await page.goto(file + '#camp/B');
  await page.waitForTimeout(600);
  const btnHidden = await page.$eval('#dCalBtn', b => b.hidden);
  const btnText = await page.$eval('#dCalBtn', b => b.textContent);
  check('B 캘린더 등록 버튼 보임', !btnHidden && btnText === '📅 캘린더 등록', btnText + ' hidden=' + btnHidden);
  await page.click('#dCalBtn');
  await page.waitForTimeout(800);
  let calls = await page.evaluate(() => window.__calls);
  const c0 = calls[0];
  check('create_event 호출', c0 && c0.server === 'Google Calendar' && c0.tool === 'create_event', JSON.stringify(c0 && { server: c0.server, tool: c0.tool }));
  check('일정 입력값', c0 && c0.input.calendarId === 'family13035616985683376181@group.calendar.google.com' && c0.input.summary === '[체험단] 네일쁨' && c0.input.startTime === '2026-10-10T12:30:00+09:00' && c0.input.endTime === '2026-10-10T14:00:00+09:00' && c0.input.overrideReminders[0].minutes === 120 && c0.input.useDefaultReminders === false && c0.input.timeZone === 'Asia/Seoul', JSON.stringify(c0 && c0.input));
  let B = await page.evaluate(() => window.__store.campaigns.B);
  check('calendar_event_id 저장', B.calendar_event_id === 'evt123' && B.calendar_synced_key === '2026-10-10T12:30' && /📅 캘린더 등록/.test(B.note), JSON.stringify({ id: B.calendar_event_id, key: B.calendar_synced_key, link: B.calendar_link }));
  const state = await page.$eval('#dCalState', e => e.textContent);
  check('등록됨 표시', /캘린더 등록됨/.test(state), state);
  check('버튼 숨김', await page.$eval('#dCalBtn', b => b.hidden));

  // 3) 시간 변경 → update_event
  await page.click('[data-toggle="info"]'); await page.waitForTimeout(150);
  await page.fill('#f_visit_time', '13:00');
  await page.dispatchEvent('#f_visit_time', 'change');
  await page.waitForTimeout(900);
  calls = await page.evaluate(() => window.__calls);
  const c1 = calls[1];
  check('update_event 호출', c1 && c1.tool === 'update_event' && c1.input.eventId === 'evt123' && c1.input.startTime === '2026-10-10T13:00:00+09:00' && c1.input.endTime === '2026-10-10T14:30:00+09:00', JSON.stringify(c1 && c1.input));
  B = await page.evaluate(() => window.__store.campaigns.B);
  check('synced_key 갱신', B.calendar_synced_key === '2026-10-10T13:00', B.calendar_synced_key);

  // 4) 지난 방문 C 는 등록 안 함
  await page.goto(file + '#camp/C');
  await page.waitForTimeout(600);
  check('지난 방문은 버튼 없음', await page.$eval('#dCalBtn', b => b.hidden));

  // 5) A: 상태 예약 완료로 → 방문일 입력 → 자동 등록
  await page.goto(file + '#camp/A');
  await page.waitForTimeout(600);
  await page.selectOption('#f_status', '예약 완료');
  await page.waitForTimeout(400);
  calls = await page.evaluate(() => window.__calls);
  check('방문일 없으면 호출 안 함', calls.length === 2, 'calls=' + calls.length);
  const st = await page.$eval('#dCalState', e => e.textContent);
  check('안내 문구', /방문일·시간을 넣으면/.test(st), st);
  await page.click('[data-toggle="info"]'); await page.waitForTimeout(150);
  await page.fill('#f_visit_date', '2026-10-12');
  await page.dispatchEvent('#f_visit_date', 'change');
  await page.waitForTimeout(900);
  calls = await page.evaluate(() => window.__calls);
  const c2 = calls[2];
  check('방문일만 있으면 종일 일정', c2 && c2.tool === 'create_event' && c2.input.allDay === true && c2.input.summary === '[체험단] 왕가네칼국수' && c2.input.startTime === '2026-10-12T00:00:00+09:00', JSON.stringify(c2 && c2.input));
  check('설명에 마감·연락처·대시보드 링크', c2 && /업로드 마감: 2026-10-05/.test(c2.input.description) && /마감일이 방문일보다 빨라요/.test(c2.input.description) && /02-123-4567/.test(c2.input.description) && c2.input.description.indexOf('#camp/A') >= 0, c2 && c2.input.description);

  await browser.close();
  console.log(fails.length ? 'FAILED: ' + fails.join(', ') : 'ALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
