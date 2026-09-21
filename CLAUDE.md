# claude_projectBLOG — 블로그

블로그 프로젝트입니다.
회사 노트북과 집 노트북에서 번갈아 작업하며, 코드는 GitHub(fleurien003/claude_projectBLOG)로 동기화하고 Claude Code는 클라우드 세션으로 사용합니다.

## 작업 규칙
- 한국어로 답변합니다.
- 작업을 하나 마칠 때마다, 사용자가 따로 말하지 않아도 다음을 자동으로 합니다.
  1. 아래 "진행 상황"과 "다음 할 일"을 최신 내용으로 고칩니다.
  2. 변경 내용을 커밋합니다.
  3. main 브랜치에 합쳐서 GitHub에 push합니다. (충돌이 나면 멈추고 사용자에게 알립니다.)
- 비밀번호, API 키, `.env` 파일은 커밋하지 않습니다.

## 진행 상황
- 2026-09-21: GitHub 저장소 생성 및 기본 설정 완료
- 2026-09-21: 르나 블로그 대시보드 아티팩트를 저장소로 가져옴 (`dashboard/index.html`, `dashboard/README.md`)
- 2026-09-21: 대시보드 소스·DB 전수 점검, 미완성 항목 정리 (`dashboard/TODO.md`)

## 대시보드
- 주소: https://claude.ai/artifact/2rKeYVVx1FnvDvkDd21m4U
- 소스: `dashboard/index.html` — 고친 뒤 **같은 주소로 다시 발행**합니다. 새 아티팩트를 만들지 않습니다.
- 고치기 전에 아티팩트를 먼저 읽어와서 저장소 파일을 최신 버전으로 맞춥니다. (다른 노트북에서 먼저 고쳤을 수 있음)

## 다음 할 일
자세한 내용은 `dashboard/TODO.md`.
- [ ] 여휘(마감 9/21) · 권문정플라워(마감 9/22) 초안 쓰기
- [ ] `campaigns`에 섞인 템플릿 문서 1건 삭제, 상태 빈 값 4건 정리
- [ ] 홈피드형 템플릿(h_*)을 `buildFeedPrompt`에 연결 + `h_kurly` 추가
- [ ] 잔여물 정리 (`photo_folder` 입력칸, 홈 4칸 이동, 죽은 코드)
