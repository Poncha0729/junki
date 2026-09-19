#!/usr/bin/env bash
#
# 新PC(macOS)に入っているアプリを棚卸しします。
#
#   このスクリプトは【表示するだけ】です。何も削除しません。
#   macOS のアプリ削除は「ゴミ箱に入れる」か `brew uninstall --cask <名前>` で行います。
#
#   bash setup/cleanup/cleanup-macos.sh
#
set -uo pipefail

c_reset=$'\033[0m'; c_cyan=$'\033[36m'; c_gray=$'\033[90m'; c_yellow=$'\033[33m'

printf '\n%s=== /Applications にあるアプリ ===%s\n' "$c_cyan" "$c_reset"
printf '%s（Apple 標準アプリは除外して表示しています）%s\n' "$c_gray" "$c_reset"

# Apple 純正アプリは消せない／消すべきでないので一覧から外す
APPLE_BUILTIN='Safari|Mail|Messages|FaceTime|Photos|Music|TV|Podcasts|News|Maps|Calendar|Contacts|Reminders|Notes|Freeform|Preview|System Settings|System Preferences|App Store|Automator|Books|Calculator|Chess|Clock|Dictionary|Find My|Font Book|Home|Image Capture|Launchpad|Mission Control|Photo Booth|QuickTime Player|Shortcuts|Siri|Stickies|Stocks|TextEdit|Time Machine|Utilities|Voice Memos|Weather|Mail|Passwords|Tips|iMovie|GarageBand|Keynote|Numbers|Pages'

count=0
while IFS= read -r app; do
  name="$(basename "$app" .app)"
  if printf '%s' "$name" | grep -qE "^($APPLE_BUILTIN)$"; then continue; fi
  size="$(du -sh "$app" 2>/dev/null | cut -f1)"
  printf '  %-45s %s\n' "$name" "${size:-?}"
  count=$((count+1))
done < <(find /Applications -maxdepth 1 -name '*.app' 2>/dev/null | sort)

printf '\n  %s%d 件（Apple 標準を除く）%s\n' "$c_gray" "$count" "$c_reset"

if command -v brew >/dev/null 2>&1; then
  printf '\n%s=== Homebrew で管理しているもの ===%s\n' "$c_cyan" "$c_reset"
  printf '%s--- cask（GUIアプリ）---%s\n' "$c_gray" "$c_reset"
  brew list --cask 2>/dev/null | sed 's/^/  /' || printf '  なし\n'
  printf '%s--- formula（CLIツール）---%s\n' "$c_gray" "$c_reset"
  brew list --formula 2>/dev/null | sed 's/^/  /' || printf '  なし\n'
fi

printf '\n%s=== ログイン時に自動起動する項目 ===%s\n' "$c_cyan" "$c_reset"
printf '%s（起動が遅い原因になりがちです）%s\n' "$c_gray" "$c_reset"
osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null \
  | tr ',' '\n' | sed 's/^ */  /' || printf '  取得できませんでした（設定 → 一般 → ログイン項目 で確認できます）\n'

cat <<NOTE

${c_yellow}削除のしかた（このスクリプトは削除しません）${c_reset}

  Homebrew で入れたアプリ:
      brew uninstall --cask <名前>

  それ以外のアプリ:
      Finder → アプリケーション → 右クリック →「ゴミ箱に入れる」

  ログイン項目を減らす:
      システム設定 → 一般 → ログイン項目

  ${c_gray}判断に迷うものは setup/cleanup/CLEANUP.md の「消してはいけないもの」を先に確認してください。${c_reset}
NOTE
