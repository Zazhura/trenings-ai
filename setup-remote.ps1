# PowerShell script for å sette opp GitHub remote
# Bruk: .\setup-remote.ps1 -RepoUrl "https://github.com/[username]/trenings-ai.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "Setting up GitHub remote..." -ForegroundColor Cyan

# Sjekk om remote allerede eksisterer
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote 'origin' eksisterer allerede: $existingRemote" -ForegroundColor Yellow
    $overwrite = Read-Host "Vil du overskrive den? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Avbrutt." -ForegroundColor Red
        exit 1
    }
    git remote remove origin
}

# Legg til remote
git remote add origin $RepoUrl
Write-Host "✓ Remote 'origin' lagt til: $RepoUrl" -ForegroundColor Green

# Push master branch
Write-Host "`nPushing master branch..." -ForegroundColor Cyan
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Suksess! Koden er pushet til GitHub." -ForegroundColor Green
    Write-Host "`nNeste steg:" -ForegroundColor Yellow
    Write-Host "1. Gå til https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Velg 'Import Git Repository'" -ForegroundColor White
    Write-Host "3. Velg 'trenings-ai' repoet" -ForegroundColor White
    Write-Host "4. Konfigurer environment variables (se DEPLOY.md)" -ForegroundColor White
} else {
    Write-Host "`n✗ Feil ved push. Sjekk at repo-URL er korrekt og at du har tilgang." -ForegroundColor Red
    exit 1
}

