<#
.SYNOPSIS
    新PC(Windows)を現行機と同じ開発環境に揃えるセットアップスクリプト。

.DESCRIPTION
    - 何度実行しても安全（導入済みのものはスキップします）
    - 何も勝手に削除しません（削除は setup/cleanup/ を参照）
    - 管理者権限の PowerShell で実行してください

.PARAMETER GitUserName
    git commit に使う名前。未指定なら対話で尋ねます。

.PARAMETER GitUserEmail
    git commit に使うメールアドレス。未指定なら対話で尋ねます。

.PARAMETER SkipApps
    アプリのインストールを飛ばし、設定とプロジェクト準備だけ行います。

.PARAMETER OpenLanPort
    同一Wi-Fi内の別の端末から開発サーバを見るため、TCP3000 を開放します。
    既定は無効。2台とも単独で動かすなら不要です。
    有効にすると確認プロンプトが出ます。

.EXAMPLE
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
    .\setup\new-pc\setup-windows.ps1
#>
[CmdletBinding()]
param(
    [string] $GitUserName,
    [string] $GitUserEmail,
    [switch] $SkipApps,
    [switch] $OpenLanPort
)

$ErrorActionPreference = 'Stop'
$script:Failures = @()

function Write-Step { param([string]$Text) Write-Host "`n=== $Text ===" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "  [OK]   $Text" -ForegroundColor Green }
function Write-Skip { param([string]$Text) Write-Host "  [SKIP] $Text" -ForegroundColor DarkGray }
function Write-Warn { param([string]$Text) Write-Host "  [WARN] $Text" -ForegroundColor Yellow }
function Write-Fail {
    param([string]$Text)
    Write-Host "  [FAIL] $Text" -ForegroundColor Red
    $script:Failures += $Text
}

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    (New-Object Security.Principal.WindowsPrincipal $id).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ----------------------------------------------------------------------------
# 0. 前提チェック
# ----------------------------------------------------------------------------
Write-Step '0. 前提チェック'

if (-not (Test-Admin)) {
    Write-Warn '管理者権限ではありません。アプリのインストールに失敗する場合があります。'
    Write-Warn 'PowerShell を右クリック →「管理者として実行」で開き直すことを推奨します。'
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Fail 'winget が見つかりません。Microsoft Store で「アプリ インストーラー」を更新してください。'
    Write-Host  '  https://apps.microsoft.com/detail/9nblggh4nns1'
    exit 1
}
Write-Ok "winget: $(winget --version)"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Write-Ok "リポジトリ: $RepoRoot"

# ----------------------------------------------------------------------------
# 1. アプリのインストール
# ----------------------------------------------------------------------------
# 現PCと揃えたい基本セット。不要なものは行頭に # を付けてコメントアウトしてください。
$Packages = @(
    @{ Id = 'Git.Git';                    Name = 'Git' }
    @{ Id = 'OpenJS.NodeJS.LTS';          Name = 'Node.js 22 LTS' }
    @{ Id = 'Microsoft.VisualStudioCode'; Name = 'Visual Studio Code' }
    @{ Id = 'Microsoft.PowerShell';       Name = 'PowerShell 7' }
    @{ Id = 'Microsoft.WindowsTerminal';  Name = 'Windows Terminal' }
    @{ Id = 'Google.Chrome';              Name = 'Google Chrome' }
    @{ Id = 'Anthropic.Claude';           Name = 'Claude デスクトップ' }
    @{ Id = 'Microsoft.PowerToys';        Name = 'PowerToys（ウィンドウ整列など）' }
    @{ Id = '7zip.7zip';                  Name = '7-Zip' }
)

if ($SkipApps) {
    Write-Step '1. アプリのインストール（-SkipApps 指定のため省略）'
} else {
    Write-Step '1. アプリのインストール'
    foreach ($pkg in $Packages) {
        $installed = winget list --id $pkg.Id --exact --accept-source-agreements 2>$null |
                     Select-String -SimpleMatch $pkg.Id -Quiet
        if ($installed) {
            Write-Skip "$($pkg.Name) は導入済み"
            continue
        }
        Write-Host "  ... $($pkg.Name) をインストール中"
        winget install --id $pkg.Id --exact --silent `
               --accept-source-agreements --accept-package-agreements | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Ok "$($pkg.Name)" }
        else { Write-Fail "$($pkg.Name) のインストールに失敗 (exit $LASTEXITCODE)" }
    }

    # インストール直後は PATH が未反映なので、この場で読み直す
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
}

# ----------------------------------------------------------------------------
# 2. Git の設定
# ----------------------------------------------------------------------------
Write-Step '2. Git の設定'

if (Get-Command git -ErrorAction SilentlyContinue) {
    if (-not $GitUserName)  { $GitUserName  = (git config --global user.name)  }
    if (-not $GitUserEmail) { $GitUserEmail = (git config --global user.email) }
    if (-not $GitUserName)  { $GitUserName  = Read-Host '  git の user.name を入力' }
    if (-not $GitUserEmail) { $GitUserEmail = Read-Host '  git の user.email を入力' }

    git config --global user.name  $GitUserName
    git config --global user.email $GitUserEmail
    git config --global init.defaultBranch main
    git config --global core.autocrlf input   # 2台で改行コードが揺れないように固定
    git config --global pull.rebase true      # 2台運用で履歴が絡まないように
    git config --global core.quotepath false  # 日本語ファイル名を文字化けさせない
    Write-Ok "user.name = $GitUserName / user.email = $GitUserEmail"
} else {
    Write-Fail 'git が PATH にありません。PowerShell を開き直して再実行してください。'
}

# ----------------------------------------------------------------------------
# 3. Node.js と pnpm/corepack
# ----------------------------------------------------------------------------
Write-Step '3. Node.js の確認'

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Ok "node $(node -v) / npm $(npm -v)"
    try { corepack enable 2>$null; Write-Ok 'corepack 有効化（pnpm/yarn が使えます）' }
    catch { Write-Warn 'corepack の有効化に失敗しました（npm のみで運用できます）' }
} else {
    Write-Fail 'node が PATH にありません。PowerShell を開き直して再実行してください。'
}

# ----------------------------------------------------------------------------
# 4. VS Code 拡張機能
# ----------------------------------------------------------------------------
Write-Step '4. VS Code 拡張機能'

$ExtFile = Join-Path $RepoRoot 'setup\dotfiles\vscode-extensions.txt'
if (Get-Command code -ErrorAction SilentlyContinue) {
    if (Test-Path $ExtFile) {
        $installedExts = @(code --list-extensions)
        foreach ($line in Get-Content $ExtFile) {
            $ext = $line.Trim()
            if (-not $ext -or $ext.StartsWith('#')) { continue }
            if ($installedExts -contains $ext) { Write-Skip $ext; continue }
            code --install-extension $ext --force | Out-Null
            if ($LASTEXITCODE -eq 0) { Write-Ok $ext } else { Write-Fail "拡張 $ext" }
        }
    } else {
        Write-Warn "拡張機能リストが見つかりません: $ExtFile"
    }
} else {
    Write-Warn 'code コマンドが見つかりません。VS Code を一度起動してから再実行してください。'
}

# ----------------------------------------------------------------------------
# 5. プロジェクトの依存関係
# ----------------------------------------------------------------------------
Write-Step '5. プロジェクトの依存関係'

Push-Location $RepoRoot
try {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm install --no-audit --no-fund
        if ($LASTEXITCODE -eq 0) { Write-Ok 'npm install 完了' }
        else { Write-Fail "npm install が失敗 (exit $LASTEXITCODE)" }
    } else {
        Write-Fail 'npm が見つからないため依存関係を入れられませんでした。'
    }
} finally {
    Pop-Location
}

# ----------------------------------------------------------------------------
# 6. LAN 公開（任意・既定では何もしない）
# ----------------------------------------------------------------------------
Write-Step '6. LAN 公開（任意）'

if ($OpenLanPort) {
    $ruleName = 'junki dev server (TCP 3000)'
    if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) {
        Write-Skip 'ファイアウォール規則は作成済み'
    } else {
        Write-Warn '同一Wi-Fi内の端末から、このPCの3000番ポートに接続できるようにします。'
        $ans = Read-Host '  作成しますか？ (y/N)'
        if ($ans -match '^[Yy]$') {
            New-NetFirewallRule -DisplayName $ruleName -Direction Inbound `
                -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private | Out-Null
            Write-Ok "$ruleName を作成（プライベートネットワークのみ）"
        } else {
            Write-Skip 'ユーザーが見送りを選択'
        }
    }
} else {
    Write-Skip '-OpenLanPort 未指定のため何もしません（2台とも単独で動かすなら不要です）'
}

# ----------------------------------------------------------------------------
# 完了
# ----------------------------------------------------------------------------
Write-Step '完了'

if ($script:Failures.Count -eq 0) {
    Write-Host "`nすべて成功しました。" -ForegroundColor Green
} else {
    Write-Host "`n$($script:Failures.Count) 件の問題が残っています:" -ForegroundColor Yellow
    $script:Failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host @"

次にやること:
  1. .\setup\new-pc\verify-windows.ps1   で検証
  2. npm run verify                      で型チェック+Lint+ビルド
  3. npm run dev                         で http://localhost:3000
  4. setup\new-pc\THINKPAD-X1-YOGA.md    で機種固有の設定（暗号化・Hello・ペン）
  5. setup\sync\SYNC.md                  で2台の同期設定
  6. setup\property\PROPERTY-SEARCH.md   で物件探しの環境づくり
"@ -ForegroundColor Cyan

if ($script:Failures.Count -gt 0) { exit 1 }
