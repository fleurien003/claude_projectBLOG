# 강남맛집 캠페인 페이지(r.jina.ai HTML 형식으로 받은 것)에서 캠페인 블록만 뽑는다. 사용: curl -sS -H "X-Return-Format: html" https://r.jina.ai/<링크> | python3 tools/gm_extract.py
# 2026-10-02 실측: 원문 HTML 23.7만 자 → 블록 3,100자(약 2천 토큰). 루틴 세션에는 저장소가 없어 지시문에 같은 코드를 한 줄로 넣어 둠.
import sys,re,html
t=sys.stdin.read()
t=re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>','',t,flags=re.S|re.I)
t=html.unescape(re.sub(r'<[^>]+>','\n',t))
t=re.sub(r'[ \t ]+',' ',t); t=re.sub(r'\s*\n\s*','\n',t).strip()
i=t.find('캠페인 정보'); 
title=re.search(r'\[[^\]]{2,20}\]\s*\n?[^\n]{1,60}',t[:max(i,0)] or t)
j=t.find('위젯을 달면',i) if i>=0 else -1
block=t[i:(j if j>i else i+3500)] if i>=0 else t[:3500]
out=(title.group(0).replace('\n',' ')+'\n' if title else '')+block
print(out[:4000])
