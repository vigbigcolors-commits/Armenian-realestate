# SmartEstate - smoke-test vsey sistemy (Windows / PowerShell)
# Zapusk: .\scripts\test_system.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$compose = Join-Path $root "docker-compose.yml"

$passed = 0
$failed = 0

Write-Host "`n=== SmartEstate System Test ===`n" -ForegroundColor Cyan

function Test-Url($name, $url, $expectStatus = 200) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        if ($r.StatusCode -eq $expectStatus) {
            Write-Host "[OK] $name ($url)" -ForegroundColor Green
            $script:passed++
            return $r
        }
        Write-Host "[FAIL] $name - status $($r.StatusCode)" -ForegroundColor Red
        $script:failed++
        return $null
    } catch {
        Write-Host "[FAIL] $name - $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

function Test-JsonField($name, $json, $field, $predicate) {
    $val = $json.$field
    if (& $predicate $val) {
        Write-Host "[OK] $name ($field = $val)" -ForegroundColor Green
        $script:passed++
        return $true
    }
    Write-Host "[WARN] $name ($field = $val)" -ForegroundColor Yellow
    return $false
}

Write-Host "--- Docker services ---" -ForegroundColor Yellow
docker compose -f $compose ps

Write-Host "`n--- HTTP endpoints ---" -ForegroundColor Yellow
Test-Url "Frontend" "http://localhost:3001/"
Test-Url "API health" "http://localhost:8000/health"
Test-Url "API stats" "http://localhost:8000/api/stats"
$props = $props = Test-Url "API properties" "http://localhost:8000/api/properties?deal_type=rent&limit=3"
if ($props) {
    $data = $props.Content | ConvertFrom-Json
    $count = if ($data.items) { $data.items.Count } else { $data.Count }
    if ($count -ge 1) {
        Write-Host "[OK] API properties items ($count)" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] API properties - empty" -ForegroundColor Red
        $script:failed++
    }
}
$statusResp = Test-Url "API system status" "http://localhost:8000/api/system/status"

if ($statusResp) {
    $status = $statusResp.Content | ConvertFrom-Json
    Write-Host "`n--- Phase 4 / 5 metrics ---" -ForegroundColor Yellow
    Test-JsonField "Active properties" $status "active_properties" { param($v) $v -ge 1 }
    Test-JsonField "Listings with photos" $status "listings_with_photos" { param($v) $v -ge 1 }
    Test-JsonField "Properties with photos (Phase 4)" $status "properties_with_photos" { param($v) $v -ge 1 }
    Test-JsonField "Clean descriptions (Phase 4)" $status "properties_with_clean_desc" { param($v) $v -ge 0 }
    Write-Host "  phase4_ready: $($status.phase4_ready)" -ForegroundColor $(if ($status.phase4_ready) { "Green" } else { "Yellow" })
    Write-Host "  phase5_ready: $($status.phase5_ready)" -ForegroundColor Green
}

Write-Host "`n--- Phase 5: price alert API ---" -ForegroundColor Yellow
try {
    $body = @{
        telegram_id   = 999999001
        deal_type     = "rent"
        district      = "Kentron"
        rooms         = 2
        price_max_usd = 500
    } | ConvertTo-Json
    $alert = Invoke-RestMethod -Uri "http://localhost:8000/api/alerts/price" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15
    if ($alert.status -eq "subscribed") {
        Write-Host "[OK] POST /api/alerts/price" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] POST /api/alerts/price - unexpected response" -ForegroundColor Red
        $script:failed++
    }
    $list = Invoke-RestMethod -Uri "http://localhost:8000/api/alerts/price/999999001" -TimeoutSec 15
    if ($list.Count -ge 1) {
        Write-Host "[OK] GET /api/alerts/price/{id}" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] GET /api/alerts/price/{id} - empty list" -ForegroundColor Red
        $script:failed++
    }
} catch {
    Write-Host "[FAIL] Price alert API - $($_.Exception.Message)" -ForegroundColor Red
    $script:failed++
}

Write-Host "`n--- Database counts ---" -ForegroundColor Yellow
docker compose -f $compose exec -T postgres psql -U smartestate -d smartestate -c @"
SELECT
  (SELECT COUNT(*) FROM properties WHERE status='active') AS properties,
  (SELECT COUNT(*) FROM listings) AS listings,
  (SELECT COUNT(*) FROM listings WHERE dedup_status='pending') AS pending_dedup,
  (SELECT COUNT(*) FROM listings WHERE photo_urls IS NOT NULL AND cardinality(photo_urls)>0) AS listings_with_photos,
  (SELECT COUNT(*) FROM properties WHERE photo_urls IS NOT NULL AND cardinality(photo_urls)>0) AS properties_with_photos,
  (SELECT COUNT(*) FROM properties WHERE description_clean IS NOT NULL) AS with_clean_desc,
  (SELECT COUNT(*) FROM price_alerts WHERE is_active) AS active_alerts;
"@

Write-Host "`n--- Phase 4 pipeline (run manually if photos missing) ---" -ForegroundColor Yellow
Write-Host "docker compose exec parser python scripts/run_phase4.py --photos 80 --descriptions 20 --dedup-batches 5"

Write-Host "`n--- Manual E2E checklist ---" -ForegroundColor Yellow
Write-Host "1. Site:      http://localhost:3001  (cards, search, map)"
Write-Host "2. Property:  open card -> gallery + description"
Write-Host "3. API docs:  http://localhost:8000/docs"
Write-Host "4. Telegram:  /start -> search -> 'Podpiska na cenu' /watch"
Write-Host "5. Parser:    docker compose logs parser --tail 30"

Write-Host "`n--- Result: $passed passed, $failed failed ---`n" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

if ($failed -gt 0) { exit 1 }
