#!/usr/bin/env python3
"""초안 금지어 검사기.

블로그가 날아가거나 신고당할 소지가 있는 말을 글에서 찾아낸다.
근거는 docs/04_금지어와_저품질_유의사항.md.

  python3 tools/banwords.py <초안.txt> --type massage   # 안마·에스테틱
  python3 tools/banwords.py <초안.txt> --type derm      # 병원·의원
  python3 tools/banwords.py <초안.txt>                  # 공통만
"""
import re, sys, argparse

# 공통 — 어떤 글에서도 쓰지 않는다
COMMON = {
    '내돈내산': '협찬 글에는 쓰지 않는다 (피부과 글만 예외)',
    '제 돈으로': '같은 이유로 금지', '사비로': '같은 이유로 금지',
    '협찬': '체험단 글에서 금지 (홈피드는 허용)',
    '체험단': '금지', '체험권': '금지', '제공받': '금지',
    '경제적 대가': '금지', '원고료': '금지', '서포터즈': '금지',
    '개선되': '"도움이 되었다", "~한 느낌이다"로 바꾼다',
}

# 안마·마사지·에스테틱 — 약손명가 리스트 + 의료법 제82조
MASSAGE = {
    '마사지': '관리', '맛사지': '관리', '안마': '관리', '경락': '관리',
    '지압': '관리', '악력': '관리', '주무르': '관리', '누르기': '관리',
    '시술': '관리', '치료': '관리', '교정': '관리',
    '통증': '쓰지 않는다', '건강': '쓰지 않는다', '뼈': '쓰지 않는다',
    '림프': '쓰지 않는다', '순환': '쓰지 않는다', '부종': '쓰지 않는다',
    '노폐물': '쓰지 않는다', '독소': '쓰지 않는다', '신진대사': '쓰지 않는다',
    '근육': '쓰지 않는다', '스트레칭': '쓰지 않는다', '혈액순환': '쓰지 않는다',
    '혈행': '피의 흐름을 도와주는',
    '뭉친': '긴장이 풀리는 느낌이다', '뭉쳐': '긴장이 풀리는 느낌이다',
    '풀어주': '사용 자제', '풀어드리': '사용 자제', '시원': '사용 자제',
    '뻐근': '사용 자제', '스트레스': '긴장된',
    '붓기제거': '붓기관리', '부종제거': '붓기관리',
    '얼굴 축소': '작은 얼굴로 관리', '안면비대칭': '얼굴 불균형',
    '틀어진': '바르지 않은', '피부재생': '피부결이 개선되는',
    '흉터제거': '흉터관리', '셀룰라이트 제거': '셀룰라이트 관리',
    '효과가 있': '~에 도움이 되었다', '효과를 주': '~에 도움이 되었다',
    '해준다': '관리해드린다', '만들어 드린다': '가꿔드린다',
    '책임제': '고객과의 약속', '요요없는': '요요 관리로',
    '골기': '약손테라피', '대사물질': '볼록한 라인', '뱀부': '사진 금지',
}

# 병원·의원 — 의료광고
DERM = {
    '추천': '의료광고로 걸린다', '할인': '의료광고로 걸린다',
    '보증': '의료광고로 걸린다', '인증': '의료광고로 걸린다',
    '광고': '의료광고로 걸린다',
    '효과': '단정하지 않는다', '비포': '시술 전후 사진은 원칙적으로 금지',
    '애프터': '시술 전후 사진은 원칙적으로 금지',
}

SETS = {'massage': MASSAGE, 'derm': DERM}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('path')
    ap.add_argument('--type', default='', choices=['', 'massage', 'derm'])
    a = ap.parse_args()

    text = open(a.path, encoding='utf-8').read()

    table = dict(COMMON)
    table.update(SETS.get(a.type, {}))
    if a.type == 'derm':
        # 피부과·의원 글에서만 '내돈내산'을 쓸 수 있다. 단 제목에는 못 쓴다.
        for w in ('내돈내산', '제 돈으로', '사비로'):
            table.pop(w, None)
        title = text.split('\n', 1)[0]
        if '내돈내산' in title:
            print('❌ 제목에 "내돈내산"이 있다 — 피부과 글도 제목에는 쓰지 않는다\n')

    hits = []
    for word, fix in table.items():
        n = text.count(word)
        if n:
            m = re.search(r'.{0,22}' + re.escape(word) + r'.{0,22}', text)
            hits.append((n, word, fix, m.group(0).replace('\n', ' ') if m else ''))

    if not hits:
        print(f'✅ {a.path} — 걸린 말 없음')
        return 0

    hits.sort(reverse=True)
    print(f'❌ {a.path} — {len(hits)}종 / 총 {sum(h[0] for h in hits)}회\n')
    for n, word, fix, ctx in hits:
        print(f'  {word}  ×{n}  →  {fix}')
        print(f'      …{ctx}…')
    return 1


if __name__ == '__main__':
    sys.exit(main())
