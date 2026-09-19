#!/usr/bin/env bash
#
# 新PC(macOS)のセットアップが完了しているかを検証します。
# 何も変更しません。読み取りのみです。
#
#   bash setup/new-pc/verify-macos.sh
#
set -uo pipefail

PASS=0; FAILED=0
c_reset=$'\033[0m'; c_green=$'\033[32m'; c_red=$'\033[31m'; c_cyan=$'\033[36m'

check() {  # check "表示名" "実行するコマンド"
  local label="$1"; shift
  local out
  if out="$("$@" 2>&1)"; then
    printf '%s  [OK]   %-26s%s %s\n' "$c_green" "$label" "$c_reset" "$(printf '%s' "$out" | head -1)"
    PASS=$((PASS+1))
  else
    printf '%s  [NG]   %-26s%s %s\n' "$c_red" "$label" "$c_reset" "$(printf '%s' "$out" | head -1)"
    FAILED=$((FAILED+1))
  fi
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

printf '%s=== コマンドの確認 ===%s\n' "$c_cyan" "$c_reset"
check 'git'      git --version
check 'node'     node --version
check 'npm'      npm --version
check 'VS Code'  bash -c 'command -v code >/dev/null && code --version | head -1 || "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --version | head -1'

printf '\n%s=== Git の設定 ===%s\n' "$c_cyan" "$c_reset"
check 'user.name'   git config --global user.name
check 'user.email'  git config --global user.email
check 'pull.rebase' git config --global pull.rebase

printf '\n%s=== Node のバージョン要件 ===%s\n' "$c_cyan" "$c_reset"
# node には --version だけ渡し、解析はシェル側で完結させる。
# 複雑な式を渡すと引用符のエスケープが壊れやすい（Windows 版で実際に踏んだ）。
check 'node >= 20' bash -c 'raw=$(node --version); v=${raw#v}; v=${v%%.*}; [ -n "$v" ] || { echo "バージョンを取得できません"; exit 1; }; [ "$v" -ge 20 ] && echo "$raw (OK)" || { echo "$raw は古すぎます（20以上が必要）"; exit 1; }'

printf '\n%s=== プロジェクト ===%s\n' "$c_cyan" "$c_reset"
check 'node_modules' bash -c "[ -d '$REPO_ROOT/node_modules' ] && echo 導入済み || { echo '未導入 — npm install を実行してください'; exit 1; }"
check 'リモート接続'  bash -c "cd '$REPO_ROOT' && git ls-remote --exit-code origin HEAD >/dev/null && echo 'origin に到達可能'"

printf '\n%s=== 結果 ===%s\n' "$c_cyan" "$c_reset"
printf '  成功 %d / 失敗 %d\n' "$PASS" "$FAILED"
if [ "$FAILED" -eq 0 ]; then
  printf '%s  セットアップは完了しています。%s\n' "$c_green" "$c_reset"
  printf '  仕上げに: npm run verify && npm run dev\n'
else
  printf '%s  上の [NG] を解消してから setup-macos.sh を再実行してください。%s\n' "$c_red" "$c_reset"
  exit 1
fi
