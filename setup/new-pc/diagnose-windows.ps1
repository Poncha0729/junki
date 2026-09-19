<#
.SYNOPSIS
    新PCの現状を診断します。

.DESCRIPTION
    読み取りのみです。設定の変更もインストールも削除も行いません。
    出力をそのまま貼れば、何が済んでいて何が残っているか判断できます。

.EXAMPLE
    .\setup\new-pc\diagnose-windows.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'SilentlyContinue'

# git や winget の出力は UTF-8 だが、コンソール既定は日本語環境だと Shift-JIS。
# 揃えておかないと日本語のコミットメッセージなどが文字化けする。
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

function Section { param([string]$T) Write-Host "`n== $T ==" -ForegroundColor Cyan }
function Line { param([string]$K, $V) Write-Host ("  {0,-22} {1}" -f $K, $V) }

Section '機種とハードウェア'
$cs = Get-CimInstance Win32_ComputerSystem
Line 'メーカー' $cs.Manufacturer
Line 'モデル'   $cs.Model
Line 'メモリ'   ("{0} GB" -f [math]::Round($cs.TotalPhysicalMemory / 1GB))
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Line 'CPU' $cpu.Name

Section 'OS'
$os = Get-CimInstance Win32_OperatingSystem
Line 'エディション' $os.Caption
Line 'ビルド'       $os.BuildNumber
Line '導入日'       $os.InstallDate

Section 'Windows Update（直近の適用）'
$hf = Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3
if ($hf) {
    foreach ($h in $hf) { Line $h.HotFixID $h.InstalledOn }
} else {
    Line '取得できず' '（設定 → Windows Update で手動確認してください）'
}

Section 'ディスク'
$v = Get-Volume -DriveLetter C
Line '容量'  ("{0} GB" -f [math]::Round($v.Size / 1GB))
Line '空き'  ("{0} GB" -f [math]::Round($v.SizeRemaining / 1GB))

Section 'ディスク暗号化（最重要）'
$bl = Get-BitLockerVolume -MountPoint 'C:'
if ($bl) {
    Line '状態'       $bl.VolumeStatus
    Line '保護'       $bl.ProtectionStatus
    Line '暗号化率'   ("{0} %" -f $bl.EncryptionPercentage)
    $keys = $bl.KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' }
    Line '回復キーの有無' $(if ($keys) { "あり（{0}件）" -f @($keys).Count } else { 'なし ← 要対応' })
} else {
    Line '取得できず' '（管理者権限で実行するか、設定→デバイスの暗号化 を確認）'
}

Section 'セキュリティ'
$av = Get-CimInstance -Namespace 'root/SecurityCenter2' -ClassName AntiVirusProduct
if ($av) {
    foreach ($a in $av) { Line '検出された製品' $a.displayName }
} else {
    Line '取得できず' '（設定 → Windows セキュリティ で確認してください）'
}

Section '開発ツール'
foreach ($c in 'winget', 'git', 'node', 'npm', 'code', 'pwsh') {
    $cmd = Get-Command $c -ErrorAction SilentlyContinue
    if ($cmd) {
        # 先に全出力を受け取ってから1行目を取る。
        # 直接 `| Select-Object -First 1` につなぐとパイプラインが早期終了し、
        # 上流のネイティブコマンドが強制終了されて出力が空になることがある。
        $out = & $c --version 2>&1
        Line $c (@($out) | Select-Object -First 1)
    } else {
        Line $c '未導入'
    }
}

Section 'インストール済みアプリ（主要なものだけ）'
$targets = @(
    @{ Id = 'Google.Chrome';              Name = 'Google Chrome' }
    @{ Id = 'Anthropic.Claude';           Name = 'Claude デスクトップ' }
    @{ Id = 'Microsoft.VisualStudioCode'; Name = 'VS Code' }
    @{ Id = 'Microsoft.PowerToys';        Name = 'PowerToys' }
    @{ Id = '7zip.7zip';                  Name = '7-Zip' }
)
if (Get-Command winget -ErrorAction SilentlyContinue) {
    $list = winget list --accept-source-agreements 2>$null | Out-String
    foreach ($t in $targets) {
        $found = $list -match [regex]::Escape($t.Id)
        Line $t.Name $(if ($found) { '導入済み' } else { '未導入' })
    }
} else {
    Line 'winget なし' '（Microsoft Store で「アプリ インストーラー」を更新）'
}

Section 'このリポジトリ'
$repo = Join-Path $HOME 'dev\junki'
if (Test-Path (Join-Path $repo '.git')) {
    Line '場所' $repo
    Push-Location $repo
    Line 'ブランチ'      (git rev-parse --abbrev-ref HEAD 2>&1)
    Line '最新コミット'  (git log --oneline -1 2>&1)
    Line 'node_modules'  $(if (Test-Path (Join-Path $repo 'node_modules')) { 'あり' } else { 'なし（npm install が必要）' })
    Pop-Location
} else {
    Line '未クローン' "$repo にありません"
}
# OneDrive の中に置いていないかの確認（置くとリポジトリが壊れます）
if ($repo -like '*OneDrive*') {
    Write-Host '  警告: リポジトリが OneDrive 配下にあります。外へ移してください。' -ForegroundColor Red
}

Write-Host "`n診断は以上です。この出力をそのまま貼ってください。" -ForegroundColor Cyan
Write-Host '（読み取りのみで、何も変更していません）' -ForegroundColor DarkGray
