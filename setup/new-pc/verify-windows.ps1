<#
.SYNOPSIS
    新PC(Windows)のセットアップが完了しているかを検証します。

.DESCRIPTION
    何も変更しません。読み取りのみです。

.EXAMPLE
    .\setup\new-pc\verify-windows.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'

# git や winget の出力は UTF-8 だが、コンソール既定は日本語環境だと Shift-JIS。
# 揃えておかないと日本語のコミットメッセージなどが文字化けする。
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$pass = 0
$failed = 0

function Test-Item {
    param([string] $Label, [scriptblock] $Check)

    # $LASTEXITCODE は「直前に動いたネイティブコマンド」の終了コードが
    # セッションに残り続ける。各チェックの前に 0 へ戻しておかないと、
    # 一度失敗した以降は、ネイティブコマンドを使わないチェック
    # （node_modules の有無など）まで道連れで失敗する。
    $global:LASTEXITCODE = 0

    try {
        # 先に全出力を受け取ってから1行目を取り出す。
        # `& $Check | Select-Object -First 1` と直接つなぐとパイプラインが
        # 早期終了し、上流のネイティブコマンドが強制終了されて
        # $LASTEXITCODE が負の値になることがある（成功していても失敗に見える）。
        $out = & $Check 2>&1

        if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }

        $result = @($out) | Select-Object -First 1

        # 2>&1 でエラーが出力に混ざるため、エラーレコードは失敗として扱う
        # （そうしないと「コマンドが見つかりません」を [OK] と表示してしまう）
        if ($result -is [System.Management.Automation.ErrorRecord]) {
            throw $result.Exception.Message
        }
        if (-not $result) { throw '値が空です' }

        Write-Host ("  [OK]   {0,-26} {1}" -f $Label, $result) -ForegroundColor Green
        $script:pass++
    } catch {
        Write-Host ("  [NG]   {0,-26} {1}" -f $Label, $_.Exception.Message) -ForegroundColor Red
        $script:failed++
    }
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

Write-Host "`n=== コマンドの確認 ===" -ForegroundColor Cyan
Test-Item 'git'     { git --version }
Test-Item 'node'    { node --version }
Test-Item 'npm'     { npm --version }
Test-Item 'VS Code' { (code --version)[0] }

Write-Host "`n=== Git の設定 ===" -ForegroundColor Cyan
Test-Item 'user.name'   { git config --global user.name }
Test-Item 'user.email'  { git config --global user.email }
Test-Item 'pull.rebase' { git config --global pull.rebase }

Write-Host "`n=== Node のバージョン要件 ===" -ForegroundColor Cyan
Test-Item 'node >= 20' {
    $major = [int](node -p 'process.versions.node.split(".")[0]')
    if ($major -lt 20) { throw "v$major は古すぎます" }
    "v$major (OK)"
}

Write-Host "`n=== プロジェクト ===" -ForegroundColor Cyan
Test-Item 'node_modules' {
    if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
        throw '未導入 — npm install を実行してください'
    }
    '導入済み'
}
Test-Item 'リモート接続' {
    Push-Location $RepoRoot
    try {
        git ls-remote --exit-code origin HEAD *> $null
        if ($LASTEXITCODE -ne 0) { throw 'origin に到達できません' }
        'origin に到達可能'
    } finally { Pop-Location }
}

Write-Host "`n=== 結果 ===" -ForegroundColor Cyan
Write-Host ("  成功 {0} / 失敗 {1}" -f $pass, $failed)
if ($failed -eq 0) {
    Write-Host '  セットアップは完了しています。' -ForegroundColor Green
    Write-Host '  仕上げに: npm run verify ; npm run dev'
} else {
    Write-Host '  上の [NG] を解消してから setup-windows.ps1 を再実行してください。' -ForegroundColor Red
    exit 1
}
