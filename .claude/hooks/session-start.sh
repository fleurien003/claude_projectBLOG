#!/bin/bash
set -uo pipefail

RULES_URL="https://raw.githubusercontent.com/fleurien003/claude-rules/main/RULES.md"
CACHE_FILE="$CLAUDE_PROJECT_DIR/.claude/RULES.cache.md"

if RULES_CONTENT=$(curl -fsSL -m 10 "$RULES_URL" 2>/dev/null); then
  echo "$RULES_CONTENT" > "$CACHE_FILE"
  echo "다음은 은아님의 최신 작업 규칙(github.com/fleurien003/claude-rules/RULES.md, 이 세션 시작 시 불러옴)입니다. 이 대화 내내 지침으로 따르세요:"
  echo ""
  echo "$RULES_CONTENT"
else
  echo "⚠️ 규칙을 불러오지 못함 — github.com/fleurien003/claude-rules 접근 실패. 아래는 저장된 사본이며 최신이 아닐 수 있습니다."
  if [ -f "$CACHE_FILE" ]; then
    echo ""
    cat "$CACHE_FILE"
  else
    echo "저장된 사본도 없습니다. 규칙 없이 진행합니다."
  fi
fi
