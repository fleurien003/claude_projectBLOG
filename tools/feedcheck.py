#!/usr/bin/env python3
"""홈피드 초안 검사기.

발행 전에 규칙을 지켰는지 숫자로 확인한다. 근거는 CLAUDE.md '홈피드 규칙'.

  python3 tools/feedcheck.py <초안.txt> --keyword 장원영가방
  python3 tools/feedcheck.py <카드.json>          # items 문서면 카드에서 키워드를 읽는다

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
KEYWORD_MIN = 5
FLOURISH_MAX = 4          # ~ 와 ! 합계
MAX_PER_PARA = 2          # 한 문단 문장 수


def load(path):
    """초안 txt 또는 items 카드 json 을 받아 (본문, 메인키워드) 로 돌려준다."""
    raw = open(path, encoding='utf-8').read()
    if path.endswith('.json'):
        d = json.loads(raw)
        return d.get('draft_content', '') or '', d.get('main_keyword', '') or ''
    return raw, ''


def check(text, keyword):
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
        n = body.count(keyword)
        detail = f'"{keyword}" 본문 {n}회 (최소 {KEYWORD_MIN}회)'
        if n < KEYWORD_MIN:
            # 띄어쓰기만 다른 형태로 썼는지 짚어준다 — 9/21에 실제로 난 사고.
            # 키워드가 붙어 있으면 정규식으로는 못 잡으므로 양쪽 공백을 지우고 센다.
            m = squash(body).count(squash(keyword))
            if m > n:
                detail += f'  ← 띄어쓴 형태로 {m}회 썼음. 키워드는 붙여서 그대로 쓴다!'
        judge(n >= KEYWORD_MIN, '메인 키워드', detail)
        judge(squash(keyword) in squash(title), '제목에 키워드', title[:50])

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
    a = ap.parse_args()

    text, kw = load(a.path)
    kw = a.keyword or kw
    bad, ok, warn = check(text, kw)

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
