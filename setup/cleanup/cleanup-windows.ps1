<#
.SYNOPSIS
    新PC(Windows)に最初から入っているソフトを棚卸しします。

.DESCRIPTION
    既定では「一覧を表示するだけ」で、何も削除しません。
    実際に削除するには -Remove を付けます（1件ずつ確認プロンプトが出ます）。

    プリインストールの整理は取り返しがつかない操作を含むため、
    「候補の提示」と「実行」を意図的に分けてあります。

.PARAMETER Remove
    削除を実行します。1件ずつ y/N の確認が入ります。

.PARAMETER All
    候補リストに載っていないものも含め、導入済みソフトを全件表示します。

.EXAMPLE
    # まずは一覧を見る（何も消えません）
    .\setup\cleanup\cleanup-windows.ps1

.EXAMPLE
    # 見た上で、1件ずつ確認しながら消す
    .\setup\cleanup\cleanup-windows.ps1 -Remove
#>
[CmdletBinding()]
param(
    [switch] $Remove,
    [switch] $All
)

$ErrorActionPreference = 'Stop'

# git や winget の出力は UTF-8 だが、コンソール既定は日本語環境だと Shift-JIS。
# 揃えておかないと日本語のコミットメッセージなどが文字化けする。
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

# ---------------------------------------------------------------------------
# 削除候補（OEMプリインストールでよく入っている、開発用途に不要なもの）
# ---------------------------------------------------------------------------
$Candidates = @(
    @{ Match = 'CandyCrush';            Why = 'ゲーム（プリインストール広告枠）' }
    @{ Match = 'king.com';              Why = 'ゲーム（プリインストール広告枠）' }
    @{ Match = 'Microsoft.BingNews';    Why = 'ニュース（ブラウザで十分）' }
    @{ Match = 'Microsoft.BingWeather'; Why = '天気（ブラウザで十分）' }
    @{ Match = 'Microsoft.GetHelp';     Why = 'ヘルプ（使わない）' }
    @{ Match = 'Microsoft.Getstarted';  Why = 'Windows の使い方ツアー' }
    @{ Match = 'Microsoft.MicrosoftSolitaireCollection'; Why = 'ゲーム' }
    @{ Match = 'Microsoft.MixedReality.Portal';          Why = 'VR用。ヘッドセットが無ければ不要' }
    @{ Match = 'Microsoft.SkypeApp';    Why = 'Skype（後継は Teams）' }
    @{ Match = 'Microsoft.ZuneMusic';   Why = 'Groove ミュージック（後継なし）' }
    @{ Match = 'Microsoft.ZuneVideo';   Why = '映画 & テレビ' }
    @{ Match = 'Microsoft.People';      Why = '連絡先アプリ（単体では使わない）' }
    @{ Match = 'Microsoft.3DBuilder';   Why = '3Dビルダー' }
    @{ Match = 'Microsoft.Print3D';     Why = '3Dプリント' }
    @{ Match = 'Clipchamp';             Why = '動画編集（使わなければ）' }
    @{ Match = 'Disney';                Why = 'プリインストールの体験版' }
    @{ Match = 'TikTok';                Why = 'プリインストールの体験版' }
    @{ Match = 'Spotify';               Why = 'プリインストール版（使うなら公式版を入れ直す方が確実）' }
    @{ Match = 'LinkedIn';              Why = 'プリインストールの体験版' }
    @{ Match = 'McAfee';                Why = '体験版セキュリティ。期限切れ後は警告を出すだけ' }
    @{ Match = 'Norton';                Why = '体験版セキュリティ。期限切れ後は警告を出すだけ' }
)

# ---------------------------------------------------------------------------
# 絶対に消してはいけないもの（候補に混ざっても除外する）
# ---------------------------------------------------------------------------
$Protected = @(
    'Microsoft.WindowsStore'
    'Microsoft.SecHealthUI'          # Windows セキュリティ
    'Microsoft.WindowsTerminal'
    'Microsoft.DesktopAppInstaller'  # winget 本体
    'Microsoft.UI.Xaml'
    'Microsoft.VCLibs'
    'Microsoft.NET'
    'Microsoft.WindowsNotepad'
    'Microsoft.Windows.Photos'
    'MicrosoftWindows.Client'
    # --- ThinkPad（Lenovo）でハードウェアを制御しているもの ---
    # 消すとファンクションキー・ペン・充電しきい値などが効かなくなる
    'LenovoUtility'        # Fnキー・特殊キー
    'LenovoSettings'       # Vantage 系の設定
    'Vantage'              # Lenovo Vantage（BIOS/ドライバ更新の経路）
    'Hotkey'
    'Pen'                  # ペン設定（X1 Yoga はペン内蔵）
)

# ---------------------------------------------------------------------------
# メーカー独自アプリは機種ごとに違い、ハードウェア制御を兼ねているものがある。
# 一律に消すと危ないため、削除候補にはせず「要判断」として一覧表示だけする。
# 判断材料は setup/new-pc/THINKPAD-X1-YOGA.md の表を参照。
# ---------------------------------------------------------------------------
$VendorPrefixes = @('Lenovo', 'E046963', 'E0469640', 'Dolby', 'Glance', 'Mirametrix')

function Test-Protected {
    param([string] $Name)
    foreach ($p in $Protected) { if ($Name -like "*$p*") { return $true } }
    return $false
}

Write-Host "`n=== 導入済みソフトの棚卸し ===" -ForegroundColor Cyan
Write-Host '既定では何も削除しません。表示のみです。' -ForegroundColor DarkGray

# Appx（ストアアプリ / プリインストールUWP）
$appx = @()
try {
    $appx = Get-AppxPackage | Where-Object { -not $_.IsFramework }
} catch {
    Write-Host '  Appx パッケージの取得に失敗しました（管理者権限で実行してください）' -ForegroundColor Yellow
}

$hits = @()
foreach ($pkg in $appx) {
    if (Test-Protected $pkg.Name) { continue }
    $match = $Candidates | Where-Object { $pkg.Name -like "*$($_.Match)*" } | Select-Object -First 1
    if ($match) {
        $hits += [pscustomobject]@{
            Name = $pkg.Name
            Full = $pkg.PackageFullName
            Why  = $match.Why
        }
    }
}

if ($hits.Count -eq 0) {
    Write-Host "`n削除候補は見つかりませんでした。きれいな状態です。" -ForegroundColor Green
} else {
    Write-Host "`n削除候補 $($hits.Count) 件:" -ForegroundColor Yellow
    $i = 0
    foreach ($h in $hits) {
        $i++
        Write-Host ("  {0,2}. {1}" -f $i, $h.Name) -ForegroundColor White
        Write-Host ("      理由: {0}" -f $h.Why) -ForegroundColor DarkGray
    }
}

# --- メーカー独自アプリ（削除候補にはしない） ---
$vendor = @()
foreach ($pkg in $appx) {
    foreach ($prefix in $VendorPrefixes) {
        if ($pkg.Name -like "*$prefix*") {
            $vendor += $pkg.Name
            break
        }
    }
}
$vendor = $vendor | Sort-Object -Unique

if ($vendor.Count -gt 0) {
    Write-Host "`nメーカー独自アプリ $($vendor.Count) 件（削除候補には含めていません）:" -ForegroundColor Cyan
    foreach ($v in $vendor) {
        Write-Host ("  - {0}" -f $v) -ForegroundColor White
    }
    Write-Host '  ハードウェア制御を兼ねているものがあります。' -ForegroundColor DarkGray
    Write-Host '  残す/消すの判断は setup\new-pc\THINKPAD-X1-YOGA.md の表を見てください。' -ForegroundColor DarkGray
}

if ($All) {
    Write-Host "`n=== 導入済み（winget 管理下）全件 ===" -ForegroundColor Cyan
    winget list --accept-source-agreements
}

# ---------------------------------------------------------------------------
# 削除の実行
# ---------------------------------------------------------------------------
if (-not $Remove) {
    Write-Host @"

この一覧を見て、消してよいものが決まったら:

    .\setup\cleanup\cleanup-windows.ps1 -Remove

を実行してください。1件ずつ y/N の確認が入ります。
全件の一覧を見たい場合は -All を付けてください。
"@ -ForegroundColor Cyan
    return
}

if ($hits.Count -eq 0) { return }

Write-Host "`n=== 削除の実行 ===" -ForegroundColor Cyan
Write-Host '各項目で y を押したものだけ削除します。Enter だけなら残します。' -ForegroundColor Yellow

$removed = 0
foreach ($h in $hits) {
    Write-Host ("`n  {0}" -f $h.Name) -ForegroundColor White
    Write-Host ("  理由: {0}" -f $h.Why) -ForegroundColor DarkGray
    $ans = Read-Host '  削除しますか？ (y/N)'
    if ($ans -match '^[Yy]$') {
        try {
            Remove-AppxPackage -Package $h.Full -ErrorAction Stop
            Write-Host '  -> 削除しました' -ForegroundColor Green
            $removed++
        } catch {
            Write-Host ("  -> 失敗: {0}" -f $_.Exception.Message) -ForegroundColor Red
        }
    } else {
        Write-Host '  -> 残しました' -ForegroundColor DarkGray
    }
}

Write-Host "`n$removed 件を削除しました。" -ForegroundColor Green
Write-Host '消しすぎた場合は Microsoft Store から入れ直せます。' -ForegroundColor DarkGray
