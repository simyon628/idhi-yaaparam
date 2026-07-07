param([string]$msg = "Minor update")

Write-Host "Adding files..." -ForegroundColor Cyan
git add .

Write-Host "Committing with co-authors..." -ForegroundColor Cyan
git commit -m $msg -m "Co-authored-by: karunajyothi2005 <karunajyothi20005@gmail.com>" -m "Co-authored-by: simyon628 <simyon628@gmail.com>"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push

Write-Host "Done! Green squares secured." -ForegroundColor Green
