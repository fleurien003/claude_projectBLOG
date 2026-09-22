#!/usr/bin/env python3
"""초안을 모바일 가독성에 맞게 다시 줄바꿈한다.

르나 규칙 (2026-09-22 확정):
  - 한 줄에 한 문장. 문장과 문장 사이는 엔터 2번 (빈 줄 1개)
  - 문단이 끝나면 엔터 4번 (빈 줄 3개)
  - 📍☎️🕖🚘 정보 줄은 붙여 쓰고, 그 위에 상호명·주소를 따로 적지 않는다

  python3 tools/reflow.py <초안.txt> [-i]      # -i 를 주면 파일을 덮어쓴다
"""
import re, sys, argparse

SUB = re.compile(r'^\s*\d{1,2}\.\s*\S')          # 소주제 줄
INFO = re.compile(r'^\s*[📍☎️🕖🚘🪑✔️✅]')        # 정보 줄
TAG = re.compile(r'^\s*#\S')
# 문장 끝: 마침표·느낌표·물음표 뒤. 숫자 사이의 점(10.5)은 건드리지 않는다
SPLIT = re.compile(r'(?<=[.!?])\s+(?=[^\s.!?])')


def sentences(chunk):
    chunk = re.sub(r'\s+', ' ', chunk).strip()
    if not chunk:
        return []
    parts = [p.strip() for p in SPLIT.split(chunk) if p.strip()]
    return parts or [chunk]


def reflow(text):
    raw = [l.rstrip() for l in text.replace('\r', '').split('\n')]
    # 1) 제목
    i = 0
    while i < len(raw) and not raw[i].strip():
        i += 1
    title = raw[i] if i < len(raw) else ''
    i += 1

    tags = [l.strip() for l in raw if TAG.match(l)]
    body = [l for l in raw[i:] if not TAG.match(l)]

    out = [title, '']  # 제목 다음은 빈 줄 하나
    para = []          # 지금 모으는 중인 문단
    prev_info = False
    first = True

    def flush():
        """모아둔 문단을 문장 단위로 내보낸다."""
        nonlocal para
        if not para:
            return
        nonlocal first
        ss = sentences(' '.join(para))
        if first:
            first = False                      # 도입부는 제목 바로 아래에 붙인다
        elif out and out[-1] != '':
            out.extend(['', '', ''])           # 문단 앞 빈 줄 3개
        for n, s in enumerate(ss):
            if n:
                out.append('')                 # 문장 사이 빈 줄 1개
            out.append(s)
        para = []

    for line in body:
        st = line.strip()
        if not st:
            continue                            # 빈 줄은 구조로 다시 만든다
        if SUB.match(st):
            flush()
            out.extend(['', '', '', st, ''])    # 소주제 앞 빈 줄 3개, 뒤 1개
            prev_info = False
            continue
        if INFO.match(st):
            flush()
            if not prev_info and out and out[-1] != '':
                out.append('')
            out.append(st)                      # 정보 줄끼리는 붙여 쓴다
            prev_info = True
            continue
        prev_info = False
        para.append(st)
    flush()

    # 앞뒤 정리
    while out and out[0] == '':
        out.pop(0)
    while out and out[-1] == '':
        out.pop()
    if tags:
        out.extend(['', ' '.join(tags)])
    return '\n'.join(out) + '\n'


def strip_place_header(text):
    """1. 위치 줄 다음의 상호명·주소 2줄을 지운다. 📍로 바로 시작하게."""
    lines = text.split('\n')
    out, i = [], 0
    while i < len(lines):
        out.append(lines[i])
        if SUB.match(lines[i] or '') and '위치' in lines[i]:
            j = i + 1
            buf = []
            while j < len(lines) and not INFO.match(lines[j] or ''):
                if lines[j].strip():
                    buf.append(j)
                j += 1
                if j - i > 6:      # 📍가 근처에 없으면 건드리지 않는다
                    buf = []
                    break
            if buf:
                i = buf[-1] + 1
                continue
        i += 1
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('path')
    ap.add_argument('-i', '--in-place', action='store_true')
    a = ap.parse_args()
    src = open(a.path, encoding='utf-8').read()
    out = reflow(strip_place_header(src))
    if a.in_place:
        open(a.path, 'w', encoding='utf-8').write(out)
        body = out.rsplit('\n\n#', 1)[0]
        n = len([l for l in body.split('\n') if l.strip()])
        print(f'{a.path} — {len(body):,}자 / {n}줄')
    else:
        sys.stdout.write(out)


if __name__ == '__main__':
    main()
