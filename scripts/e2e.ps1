$ErrorActionPreference = 'Stop'
$url = "https://clicksmile-backend.onrender.com"
$origin = "https://click-smile.vercel.app"

Write-Host "=== REGISTER ==="
$email = "admine2e_test$([datetime]::now.ticks)@test.com"
$body = @{
    perfil = "TENANT_ADMIN"
    nome = "Admin E2E"
    email = $email
    senha = "password123"
    nomeClinica = "Clinica E2E"
    cnpj = "99111222000199"
} | ConvertTo-Json

$registerReq = Invoke-WebRequest -Uri "$url/api/auth/register" -Method Post -Body $body -ContentType "application/json" -Headers @{ "Origin" = $origin } -SessionVariable sess
Write-Host "STATUS: $($registerReq.StatusCode)"
$cookie = $registerReq.Headers["Set-Cookie"]
Write-Host "SET-COOKIE: $cookie"
Write-Host "CORS ORIGIN: $($registerReq.Headers["Access-Control-Allow-Origin"])"
Write-Host "CORS CREDENTIALS: $($registerReq.Headers["Access-Control-Allow-Credentials"])"

$jwt = ($registerReq.Content | ConvertFrom-Json).accessToken

Write-Host "`n=== GET /usuarios/me ==="
$meReq = Invoke-WebRequest -Uri "$url/api/usuarios/me" -Method Get -Headers @{ "Origin" = $origin; "Authorization" = "Bearer $jwt" } -WebSession $sess
Write-Host "STATUS: $($meReq.StatusCode)"
Write-Host "BODY: $($meReq.Content)"

Write-Host "`n=== LOGIN ==="
$loginBody = @{ email = $email; senha = "password123" } | ConvertTo-Json
$loginReq = Invoke-WebRequest -Uri "$url/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -Headers @{ "Origin" = $origin } -WebSession $sess
Write-Host "STATUS: $($loginReq.StatusCode)"
Write-Host "SET-COOKIE: $($loginReq.Headers["Set-Cookie"])"

Write-Host "`n=== REFRESH ==="
$refreshReq = Invoke-WebRequest -Uri "$url/api/auth/refresh" -Method Post -Headers @{ "Origin" = $origin } -WebSession $sess
Write-Host "STATUS: $($refreshReq.StatusCode)"
Write-Host "SET-COOKIE: $($refreshReq.Headers["Set-Cookie"])"

$newJwt = ($refreshReq.Content | ConvertFrom-Json).accessToken

Write-Host "`n=== LOGOUT ==="
$logoutReq = Invoke-WebRequest -Uri "$url/api/auth/logout" -Method Post -Headers @{ "Origin" = $origin } -WebSession $sess
Write-Host "STATUS: $($logoutReq.StatusCode)"
Write-Host "SET-COOKIE: $($logoutReq.Headers["Set-Cookie"])"

Write-Host "`n=== GET /usuarios/me APOS LOGOUT ==="
try {
    $meAfterLogout = Invoke-WebRequest -Uri "$url/api/usuarios/me" -Method Get -Headers @{ "Origin" = $origin; "Authorization" = "Bearer $jwt" } -WebSession $sess
    Write-Host "STATUS: $($meAfterLogout.StatusCode)"
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode)"
    Write-Host "ERROR: $($_.Exception.Message)"
}
