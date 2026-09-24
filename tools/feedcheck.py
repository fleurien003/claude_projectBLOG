#!/usr/bin/env python3
"""홈피드 초안 검사기.

발행 전에 규칙을 지켰는지 숫자로 확인한다. 근거는 CLAUDE.md '홈피드 규칙'.

  python3 tools/feedcheck.py <초안.txt> --keyword 장원영가방
  python3 tools/feedcheck.py <카드.json>          # items 문서면 카드에서 키워드·분류를 읽는다
  python3 tools/feedcheck.py <초안.txt> --keyword 설악산단풍 --category travel_spot

2026-09-23 신설. 만든 계기는 9/21 장원영 카드였다.
카드의 main_keyword 가 '장원영가방'인데 초안은 '장원영 가방'(띄어쓰기)으로 써서
메인 키워드가 본문에 0회 들어갔다. 상위노출이 목적인 글에서 이게 제일 치명적이다.
"""
import json, re, sys, argparse

SUB = re.compile(r'^\s*\d{1,2}\.\s*\S')
TAG = re.compile(r'^\s*#\S')
SPLIT = re.compile(r'(?<=[.!?~])\s+(?=[^\s.!?~])')
MD = re.compile(r'(^\s*[#>*]\s)|(\*\*)')
DATE = re.compile(r'\d{1,2}월\s*\d{1,2}일|지난\s*(?:주말|주|달)|어제|오늘|그제')

# 홈피드 규칙 (CLAUDE.md)
BODY_MIN, BODY_MAX = 1300, 1700
SUB_MIN, SUB_MAX = 3, 5
TAGS_EXACT = 30
KEYWORD_MIN = 5          # 붙인 형태 + 띄운 형태 합계
KEYWORD_JOINED_MIN = 3   # 그중 붙인 형태로 최소 몇 번
FLOURISH_MAX = 4          # ~ 와 ! 합계
MAX_PER_PARA = 2          # 한 문단 문장 수

# 카테고리별 제목 공식 (2026-09-23 르나 승인, docs/06_제목_첫단어_키워드_검증.md)
# 네이버 블로그 탭 상위 제목 161개 실측. (앞에 붙어도 되는 말, 설명)
#   연예만 "키워드 맨 앞 + 훅". 여행명소는 연도, 컬리는 판매처가 먼저 온다.
TITLE_HEAD = {
    'celeb':        (r'',                          '메인 키워드로 시작 + 훅'),
    'ott':          (r'(넷플릭스|디즈니\+?|티빙|쿠팡플레이|웨이브|드라마)?', '(플랫폼) 작품명으로 시작'),
    'finance':      (r'(20\d\d년?)?',                '(2026년) 제도명으로 시작'),
    'travel_issue': (r'(20\d\d|\d{1,2}월)*',          '(2026·9월) 연휴명+행동으로 시작'),
    'travel_spot':  (r'20\d\d',                     '"2026 + 명소명"으로 시작'),
    'kurly_pick':   (r'컬리',                       '"컬리 + 품목"으로 시작'),
}


def load(path):
    """초안 txt 또는 items 카드 json 을 받아 (본문, 메인키워드, 분류) 로 돌려준다."""
    raw = open(path, encoding='utf-8').read()
    if path.endswith('.json'):
        d = json.loads(raw)
        d = d.get('data', d)
        return (d.get('draft_content', '') or '', d.get('main_keyword', '') or '',
                d.get('category_key', '') or '')
    return raw, '', ''


def check(text, keyword, category=''):
    lines = [l.rstrip() for l in text.replace('\r', '').split('\n')]
    nonblank = [l.strip() for l in lines if l.strip()]
    if not nonblank:
        return [('❌', '본문', '비어 있음')], [], []

    title = nonblank[0]
    tag_line = next((l for l in nonblank if TAG.match(l)), '')
    tags = tag_line.split() if tag_line else []
    body = text.split('\n' + tag_line)[0] if tag_line else text
    body_len = len(body.strip())
    subs = [l for l in nonblank if SUB.match(l)]

    bad, ok, warn = [], [], []

    def judge(cond, label, detail):
        (ok if cond else bad).append(('✅' if cond else '❌', label, detail))

    def flag(cond, label, detail):
        """사람이 눈으로 봐야 하는 것. 틀렸다고 단정하지 않는다."""
        (ok if cond else warn).append(('✅' if cond else '⚠️', label, detail))

    judge(BODY_MIN <= body_len <= BODY_MAX, '본문 길이',
          f'{body_len:,}자 (목표 {BODY_MIN:,}~{BODY_MAX:,})')
    judge(SUB_MIN <= len(subs) <= SUB_MAX, '소주제 수',
          f'{len(subs)}개 (목표 {SUB_MIN}~{SUB_MAX})')
    judge(len(tags) == TAGS_EXACT and len(set(tags)) == len(tags),
          '해시태그', f'{len(tags)}개 (정확히 {TAGS_EXACT}개, 중복 {len(tags)-len(set(tags))})')

    def squash(x):
        return re.sub(r'\s+', '', x)

    if keyword:
        # 2026-09-23 확정 — 붙인 형태와 띄운 형태를 둘 다 넣는다.
        #
        # 네이버는 형태소 단위로 분석하고, 띄어쓰기에 따라 노출이 달라진 사례가
        # 실제로 보고된다. 어느 쪽이 걸릴지 단정할 공식 자료가 없고, 한 글에
        # 여러 표기를 넣어도 순위가 분산되지 않으므로(Ahrefs) 둘 다 건다.
        #
        #   붙인 형태  본문 3회 이상      ← 검색 질의와 같은 꼴
        #   띄운 형태  제목에 1회         ← 사람이 먼저 읽는다. 홈피드는 CTR로 돈다
        joined = squash(keyword)
        n_join = body.count(joined)
        n_all = squash(body).count(joined)      # 공백을 지우고 세면 두 형태가 다 잡힌다
        n_space = n_all - n_join

        judge(n_join >= KEYWORD_JOINED_MIN,
              '메인 키워드(붙여서)',
              f'"{joined}" 본문 {n_join}회 (최소 {KEYWORD_JOINED_MIN}회)')
        judge(n_all >= KEYWORD_MIN,
              '메인 키워드(합계)',
              f'붙인 {n_join}회 + 띄운 {n_space}회 = {n_all}회 (최소 {KEYWORD_MIN}회)')

        in_title = joined in squash(title)
        spaced_in_title = in_title and joined not in title
        judge(in_title, '제목에 키워드', title[:50])

        cat = 'celeb' if category.startswith('celeb') else category
        if cat in TITLE_HEAD and in_title:
            prefix, desc = TITLE_HEAD[cat]
            head = squash(title)
            # 컬리는 판매처가 먼저라 키워드 자체는 "컬리" 바로 뒤에 온다
            ok_head = re.match(prefix + re.escape(joined), head) is not None
            if cat == 'kurly_pick':
                ok_head = head.startswith('컬리') and joined in head[:len('컬리') + len(joined) + 4]
            judge(ok_head, '제목 공식', f'{desc} — {title[:40]}')
        if in_title:
            flag(spaced_in_title, '제목 띄어쓰기',
                 '띄운 형태로 들어감 ✓' if spaced_in_title else '붙여 썼음 — 제목은 띄우는 쪽이 읽기 좋다')

    # 2026-09-24 르나 결정 — 제목 훅에서 괄호는 뺀다 (docs/07)
    brackets = re.findall(r'[【】\[\]()]', title)
    flag(not brackets, '제목 괄호', '없음' if not brackets else f'{"".join(brackets)} — 제목에는 괄호를 쓰지 않아요')

    flourish = body.count('~') + body.count('!')
    judge(flourish <= FLOURISH_MAX, '~ 와 ! 개수', f'{flourish}개 (최대 {FLOURISH_MAX})')

    over = [l for l in nonblank
            if not SUB.match(l) and not TAG.match(l) and l != title
            and len([x for x in SPLIT.split(l) if x.strip()]) > MAX_PER_PARA]
    judge(not over, '문단당 문장', f'3문장 이상인 문단 {len(over)}개 (최대 {MAX_PER_PARA}문장)')

    judge(not MD.search(body), '마크다운 기호', '#, >, *, ** 는 쓰지 않는다')

    # 날짜는 무조건 금지가 아니다. 개막일·공개일·축제 기간은 독자에게 필요한 정보고,
    # 기사 보도일이나 "지난 주말에" 같은 내 시점 표현만 빼면 된다. 그래서 ⚠️ 로만 띄운다.
    hits = DATE.findall(body)
    flag(not hits, '날짜 표현',
         f'{hits} — 개막일·공개일이면 그대로 두고, 기사 보도일·내 시점이면 빼세요' if hits else '없음')

    circled = [l for l in subs if re.match(r'^\s*[①②③④⑤]', l)]
    judge(not circled, '소주제 번호', '1. 2. 3. 형식 (①②③ 금지)')

    return bad, ok, warn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('path')
    ap.add_argument('--keyword', default='')
    ap.add_argument('--category', default='', help='celeb_fashion·ott·finance·travel_issue·travel_spot·kurly_pick')
    a = ap.parse_args()

    text, kw, cat = load(a.path)
    kw = a.keyword or kw
    cat = a.category or cat
    bad, ok, warn = check(text, kw, cat)

    if bad:
        print(f'❌ {a.path} — {len(bad)}개 항목 위반\n')
        for _, label, detail in bad:
            print(f'  ❌ {label} : {detail}')
    else:
        print(f'✅ {a.path} — 고쳐야 할 것 없음')

    if warn:
        print()
        for _, label, detail in warn:
            print(f'  ⚠️  {label} : {detail}')
    if ok:
        print('\n  통과: ' + ', '.join(l for _, l, _ in ok))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
