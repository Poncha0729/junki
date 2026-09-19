<#
.SYNOPSIS
    新PCのセットアップを1コマンドで開始する。

.DESCRIPTION
    次のことをまとめてやる。手動での手順を減らすためのもの。

      1. git が無ければ winget で入れる
      2. リポジトリが無ければ clone、あれば main に切り替えて pull
      3. setup-windows.ps1 を実行する

    管理者権限の PowerShell から、次の1行で呼び出せる。

      $u='https://raw.githubusercontent.com/Poncha0729/junki/main/setup/new-pc/bootstrap.ps1'; $f="$env:TEMP\junki-bootstrap.ps1"; Invoke-WebRequest -UseBasicParsing $u -OutFile $f; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; & $f

    何も削除しない。導入済みのものはスキップされる。
#>
[CmdletBinding()]
param(
    [string] $RepoUrl = 'https://github.com/Poncha0729/junki.git',
    [string] $RepoDir = (Join-Path $HOME 'dev\junki')
)

# git は進捗を stderr に書くため、'Stop' だと正常な出力で止まってしまう。
# 代わりに各コマンドの終了コードを自分で確認する。
$ErrorActionPreference = 'Continue'

# git や winget の出力は UTF-8 だが、コンソール既定は日本語環境だと Shift-JIS。
# 揃えておかないと日本語のコミットメッセージなどが文字化けする。
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

function Say { param([string]$T) Write-Host "`n>>> $T" -ForegroundColor Cyan }

function Test-LastExit {
    param([string]$What)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  $What に失敗しました (exit $LASTEXITCODE)" -ForegroundColor Red
        return $false
    }
    return $true
}

Say 'git の確認'
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "  導入済み: $(git --version)"
} else {
    Write-Host '  未導入のため winget で入れます'
    winget install --id Git.Git -e --silent `
        --accept-source-agreements --accept-package-agreements | Out-Null
    # インストール直後は PATH が未反映なので読み直す
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host '  git を PATH から見つけられませんでした。' -ForegroundColor Red
        Write-Host '  PowerShell を開き直してから、もう一度この1行を実行してください。' -ForegroundColor Yellow
        return
    }
    Write-Host "  導入しました: $(git --version)"
}

Say 'リポジトリの取得'
# OneDrive 配下だと node_modules と .git が壊れるため、置き場所を先に確認する
if ($RepoDir -like '*OneDrive*') {
    Write-Host "  $RepoDir は OneDrive 配下です。別の場所を指定してください。" -ForegroundColor Red
    return
}

if (Test-Path (Join-Path $RepoDir '.git')) {
    Write-Host "  既にあります: $RepoDir"
    git -C $RepoDir checkout main
    if (-not (Test-LastExit 'main への切り替え')) { return }
    git -C $RepoDir pull --ff-only
    if (-not (Test-LastExit 'pull')) {
        Write-Host '  ローカルに変更が残っている可能性があります。' -ForegroundColor Yellow
        Write-Host "  git -C `"$RepoDir`" status で確認してください。" -ForegroundColor Yellow
        return
    }
} else {
    $parent = Split-Path $RepoDir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    git clone $RepoUrl $RepoDir
    if (-not (Test-LastExit 'clone')) { return }
}
Write-Host "  最新: $(git -C $RepoDir log --oneline -1)"

Say 'セットアップの実行'
Set-Location $RepoDir
& (Join-Path $RepoDir 'setup\new-pc\setup-windows.ps1')
