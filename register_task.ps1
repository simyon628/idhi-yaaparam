$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File 'd:\idhi yaaparam\commit.ps1' -msg 'Auto daily green square commit'"
$trigger = New-ScheduledTaskTrigger -Daily -At 11:30PM
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "DailyGitHubCommit_IdhiYaaparam" -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host "Task successfully registered!" -ForegroundColor Green
