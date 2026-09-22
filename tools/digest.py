#!/usr/bin/env python3
"""체험단 재료 압축기.

/research 결과와 블로그 본문 json을 읽어서, 초안에 실제로 쓰이는 줄만 뽑아
1,500자 안팎의 요약으로 만든다. 본문을 통째로 읽으면 한 건당 1만 자가
대화에 실리는데, 그 대화는 턴마다 통째로 다시 전송되므로 비용이 누적된다.

사용법:
  python3 tools/digest.py <research.json> --got "국밥정식,찰순대"

기본은 /research 스니펫만 쓴다. 블로그 본문은 통째로 읽지 않는다 (2026-09-21 확정).
가격처럼 스니펫에 안 나오는 값은 프롬프트에 넣지 말고 비워 둔다.

--got 에 적은 '내가 받은 것'이 들어간 문장을 가장 먼저, 가장 많이 남긴다.
"""
import json, re, sys, argparse
from collections import Counter

# 초안에 실제로 필요한 정보가 담긴 줄만 통과시킨다
KEEP = re.compile(
    r'(원\b|,000|영업시간|브레이크|라스트오더|주차|출구|도보|분\s*거리|'
    r'메뉴|주문|세트|정식|가격|반찬|추천|웨이팅|대기|예약|포장|배달|'
    r'맛|식감|국물|부드럽|촉촉|잡내|시원|담백|고소|푸짐|넉넉|친절|분위기|좌석|혼밥)'
)
# 글로 옮길 수 없는 줄은 버린다
DROP = re.compile(r'(^#|구독|이웃|공감|협찬|체험단|제공받|원고료|내돈내산|블로그|포스팅)')


def sentences(text):
    for raw in re.split(r'\n+', text or ''):
        raw = raw.strip().strip('​')
        if len(raw) < 18 or DROP.search(raw):
            continue
        for s in re.split(r'(?<=[.!?])\s+', raw):
            s = s.strip()
            if 18 <= len(s) <= 160:
                yield s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('research')
    ap.add_argument('bodies', nargs='*')
    ap.add_argument('--got', default='', help="내가 받은 것, 쉼표 구분")
    ap.add_argument('--limit', type=int, default=1600, help='요약 최대 글자수')
    a = ap.parse_args()

    got = [g.strip() for g in a.got.split(',') if g.strip()]
    r = json.load(open(a.research, encoding='utf-8'))

    print('[업체 기본]')
    p = r.get('place_info') or {}
    for k, label in (('title', '상호'), ('category', '업종'), ('roadAddress', '도로명'),
                     ('address', '지번'), ('phone', '전화')):
        if p.get(k):
            print(f'  {label} : {p[k]}')
    ad = r.get('search_ad') or {}
    if ad.get('relKeyword'):
        # 검색광고 API는 10 미만이면 숫자 대신 '< 10' 을 돌려준다
        def num(v):
            try:
                return int(str(v).replace(',', '').strip())
            except (TypeError, ValueError):
                return None
        pc, mo = num(ad.get('monthlyPcQcCnt')), num(ad.get('monthlyMobileQcCnt'))
        vol = f'{pc + mo:,}회' if pc is not None and mo is not None else '10회 미만'
        print(f"  검색량 : {ad['relKeyword']} 월 {vol} (경쟁 {ad.get('compIdx','-')})")

    pool = []
    for f in a.bodies:
        d = json.load(open(f, encoding='utf-8'))
        pool += list(sentences(d.get('text')))
    # 스니펫은 이미 요약본이라 문장으로 쪼개지 않는다.
    # 쪼개면 '받은 것'이 걸린 대목이 필터에 잘려 나간다.
    for s in (r.get('reviews') or {}).get('snippets', []):
        for part in (s.get('title'), s.get('summary')):
            part = re.sub(r'\s+', ' ', (part or '')).strip()
            if len(part) >= 18 and not DROP.search(part):
                pool.append(part[:200])

    seen, mine, rest = set(), [], []
    for s in pool:
        key = re.sub(r'\W', '', s)[:40]
        if key in seen:
            continue
        seen.add(key)
        (mine if any(g in s for g in got) else rest).append(s)

    def emit(title, rows, budget):
        if not rows:
            return 0
        print(f'\n{title}')
        used = 0
        for s in rows:
            if used + len(s) > budget:
                break
            print(f'  - {s}')
            used += len(s)
        return used

    spent = emit(f"[내가 받은 것({', '.join(got)})에 대한 남의 후기]", mine,
                 int(a.limit * 0.6)) if got else 0
    # 정보 밀도가 높은(= 긴) 문장부터 남긴다. 파편이 자리를 먹지 않게.
    kept = sorted((s for s in rest if KEEP.search(s)), key=len, reverse=True)
    emit('[그 밖에 반복되는 정보]', kept, a.limit - spent)

    print(f'\n(원본 {sum(len(s) for s in pool):,}자 → 요약 {a.limit}자 이내)')


if __name__ == '__main__':
    main()
