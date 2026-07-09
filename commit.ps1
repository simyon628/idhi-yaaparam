param([string]$msg = "Minor update")

# Check if there are any changes (staged or unstaged)
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "No changes detected. Generating auto-commit entry to secure green square..." -ForegroundColor Yellow
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path "$PSScriptRoot/daily_commit_log.txt" -Value "Auto daily commit at $date"
}

Write-Host "Adding files..." -ForegroundColor Cyan
git add .

Write-Host "Committing with co-authors..." -ForegroundColor Cyan
git commit -m "$msg" -m "Co-authored-by: karunajyothi2005 <karunajyothi20005@gmail.com>" -m "Co-authored-by: simyon628 <simyon628@gmail.com>"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed! Check internet connection."
    exit 1
}

Write-Host "Done! Green squares secured." -ForegroundColor Green
exit 0
