#!/usr/bin/env bash
#
# 新PC(macOS)を現行機と同じ開発環境に揃えるセットアップスクリプト。
#
#   - 何度実行しても安全（導入済みのものはスキップします）
#   - 何も勝手に削除しません（削除は setup/cleanup/ を参照）
#
# 使い方:
#   bash setup/new-pc/setup-macos.sh
#
# オプション:
#   --skip-apps          アプリのインストールを飛ばす
#   --name  "山田 太郎"  git の user.name
#   --email "you@example.com"  git の user.email
#
set -uo pipefail

SKIP_APPS=0
GIT_NAME=""
GIT_EMAIL=""

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-apps) SKIP_APPS=1; shift ;;
    --name)      GIT_NAME="${2:-}"; shift 2 ;;
    --email)     GIT_EMAIL="${2:-}"; shift 2 ;;
    -h|--help)   sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "不明なオプション: $1" >&2; exit 2 ;;
  esac
done

FAILURES=()

c_reset=$'\033[0m'; c_cyan=$'\033[36m'; c_green=$'\033[32m'
c_gray=$'\033[90m';  c_yellow=$'\033[33m'; c_red=$'\033[31m'

step() { printf '\n%s=== %s ===%s\n' "$c_cyan"  "$1" "$c_reset"; }
ok()   { printf '%s  [OK]   %s%s\n'  "$c_green" "$1" "$c_reset"; }
skip() { printf '%s  [SKIP] %s%s\n'  "$c_gray"  "$1" "$c_reset"; }
warn() { printf '%s  [WARN] %s%s\n'  "$c_yellow" "$1" "$c_reset"; }
fail() { printf '%s  [FAIL] %s%s\n'  "$c_red"   "$1" "$c_reset"; FAILURES+=("$1"); }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# ---------------------------------------------------------------------------
# 0. 前提チェック
# ---------------------------------------------------------------------------
step '0. 前提チェック'

if [ "$(uname -s)" != "Darwin" ]; then
  fail "macOS 用のスクリプトです（検出: $(uname -s)）。Windows なら setup-windows.ps1 を使ってください。"
  exit 1
fi
ok "macOS $(sw_vers -productVersion) / $(uname -m)"
ok "リポジトリ: $REPO_ROOT"

# Xcode Command Line Tools（git などの前提）
if ! xcode-select -p >/dev/null 2>&1; then
  warn 'Xcode Command Line Tools が未導入です。インストーラを起動します。'
  warn '画面の指示に従って完了させてから、このスクリプトを再実行してください。'
  xcode-select --install || true
  exit 1
fi
ok 'Xcode Command Line Tools'

# Homebrew
if ! command -v brew >/dev/null 2>&1; then
  if [ "$SKIP_APPS" = "1" ]; then
    warn 'Homebrew が未導入ですが --skip-apps のため導入しません。'
  else
    echo '  ... Homebrew をインストール中'
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
      || fail 'Homebrew のインストールに失敗'
  fi
fi

# Apple Silicon と Intel で brew のパスが違うので両方見る
for brew_path in /opt/homebrew/bin/brew /usr/local/bin/brew; do
  [ -x "$brew_path" ] && eval "$("$brew_path" shellenv)" && break
done
command -v brew >/dev/null 2>&1 && ok "Homebrew $(brew --version | head -1)"

# ---------------------------------------------------------------------------
# 1. アプリのインストール
# ---------------------------------------------------------------------------
# 現PCと揃えたい基本セット。不要な行は # でコメントアウトしてください。
FORMULAE=(
  git
  node@22
  gh          # GitHub CLI
  jq
)
CASKS=(
  visual-studio-code
  google-chrome
  claude        # Claude デスクトップ
  rectangle     # ウィンドウ整列（2画面運用で効きます）
)

if [ "$SKIP_APPS" = "1" ]; then
  step '1. アプリのインストール（--skip-apps のため省略）'
elif ! command -v brew >/dev/null 2>&1; then
  step '1. アプリのインストール'
  fail 'brew が使えないためスキップしました。'
else
  step '1. アプリのインストール'
  for f in "${FORMULAE[@]}"; do
    if brew list --formula "$f" >/dev/null 2>&1; then
      skip "$f は導入済み"
    else
      echo "  ... $f をインストール中"
      brew install "$f" >/dev/null 2>&1 && ok "$f" || fail "$f のインストールに失敗"
    fi
  done
  for c in "${CASKS[@]}"; do
    if brew list --cask "$c" >/dev/null 2>&1; then
      skip "$c は導入済み"
    else
      echo "  ... $c をインストール中"
      brew install --cask "$c" >/dev/null 2>&1 && ok "$c" || fail "$c のインストールに失敗"
    fi
  done

  # node@22 は keg-only なので PATH を通す
  if brew list --formula node@22 >/dev/null 2>&1; then
    NODE_PREFIX="$(brew --prefix node@22)"
    export PATH="$NODE_PREFIX/bin:$PATH"
    SHELL_RC="$HOME/.zshrc"
    LINE="export PATH=\"$NODE_PREFIX/bin:\$PATH\""
    if ! grep -qF "$LINE" "$SHELL_RC" 2>/dev/null; then
      printf '\n# node@22 (junki setup)\n%s\n' "$LINE" >> "$SHELL_RC"
      ok "$SHELL_RC に node@22 の PATH を追記"
    else
      skip '.zshrc の PATH 設定は追記済み'
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 2. Git の設定
# ---------------------------------------------------------------------------
step '2. Git の設定'

if command -v git >/dev/null 2>&1; then
  [ -z "$GIT_NAME" ]  && GIT_NAME="$(git config --global user.name  || true)"
  [ -z "$GIT_EMAIL" ] && GIT_EMAIL="$(git config --global user.email || true)"
  [ -z "$GIT_NAME" ]  && read -r -p '  git の user.name を入力: '  GIT_NAME
  [ -z "$GIT_EMAIL" ] && read -r -p '  git の user.email を入力: ' GIT_EMAIL

  git config --global user.name  "$GIT_NAME"
  git config --global user.email "$GIT_EMAIL"
  git config --global init.defaultBranch main
  git config --global core.autocrlf input    # 2台で改行コードが揺れないように固定
  git config --global pull.rebase true       # 2台運用で履歴が絡まないように
  git config --global core.quotepath false   # 日本語ファイル名を文字化けさせない
  git config --global core.precomposeunicode true  # macOS の濁点分解対策
  ok "user.name = $GIT_NAME / user.email = $GIT_EMAIL"
else
  fail 'git が見つかりません。'
fi

# ---------------------------------------------------------------------------
# 3. Node.js の確認
# ---------------------------------------------------------------------------
step '3. Node.js の確認'

if command -v node >/dev/null 2>&1; then
  ok "node $(node -v) / npm $(npm -v)"
  corepack enable >/dev/null 2>&1 && ok 'corepack 有効化（pnpm/yarn が使えます）' \
    || warn 'corepack の有効化に失敗しました（npm のみで運用できます）'
else
  fail 'node が PATH にありません。ターミナルを開き直して再実行してください。'
fi

# ---------------------------------------------------------------------------
# 4. VS Code 拡張機能
# ---------------------------------------------------------------------------
step '4. VS Code 拡張機能'

CODE_BIN="$(command -v code || true)"
if [ -z "$CODE_BIN" ] && [ -x '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code' ]; then
  CODE_BIN='/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
fi

EXT_FILE="$REPO_ROOT/setup/dotfiles/vscode-extensions.txt"
if [ -n "$CODE_BIN" ] && [ -f "$EXT_FILE" ]; then
  INSTALLED="$("$CODE_BIN" --list-extensions 2>/dev/null || true)"
  while IFS= read -r line; do
    ext="$(printf '%s' "$line" | tr -d '[:space:]')"
    [ -z "$ext" ] && continue
    case "$ext" in \#*) continue ;; esac
    if printf '%s\n' "$INSTALLED" | grep -qix "$ext"; then
      skip "$ext"
    else
      "$CODE_BIN" --install-extension "$ext" --force >/dev/null 2>&1 \
        && ok "$ext" || fail "拡張 $ext"
    fi
  done < "$EXT_FILE"
elif [ -z "$CODE_BIN" ]; then
  warn 'code コマンドが見つかりません。VS Code を一度起動し、コマンドパレットで'
  warn '"Shell Command: Install code command in PATH" を実行してから再実行してください。'
else
  warn "拡張機能リストが見つかりません: $EXT_FILE"
fi

# ---------------------------------------------------------------------------
# 5. プロジェクトの依存関係
# ---------------------------------------------------------------------------
step '5. プロジェクトの依存関係'

if command -v npm >/dev/null 2>&1; then
  ( cd "$REPO_ROOT" && npm install --no-audit --no-fund ) \
    && ok 'npm install 完了' || fail 'npm install が失敗'
else
  fail 'npm が見つからないため依存関係を入れられませんでした。'
fi

# ---------------------------------------------------------------------------
# 完了
# ---------------------------------------------------------------------------
step '完了'

if [ "${#FAILURES[@]}" -eq 0 ]; then
  printf '\n%sすべて成功しました。%s\n' "$c_green" "$c_reset"
else
  printf '\n%s%d 件の問題が残っています:%s\n' "$c_yellow" "${#FAILURES[@]}" "$c_reset"
  for f in "${FAILURES[@]}"; do printf '%s  - %s%s\n' "$c_yellow" "$f" "$c_reset"; done
fi

cat <<'NEXT'

次にやること:
  1. bash setup/new-pc/verify-macos.sh   で検証
  2. npm run verify                      で型チェック+Lint+ビルド
  3. npm run dev                         で http://localhost:3000
  4. setup/sync/SYNC.md                  で2台の同期設定
  5. setup/tablet/TABLET.md              でタブレット閲覧の設定
NEXT

[ "${#FAILURES[@]}" -eq 0 ] || exit 1
