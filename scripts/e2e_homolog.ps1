$ErrorActionPreference = 'Stop'
$url = "https://clicksmile-backend.onrender.com"
$origin = "https://click-smile.vercel.app"
$timestamp = $([datetime]::now.ticks)

Write-Host "`n=== TESTE 1: REGISTER ==="
$emailA = "user_A_$timestamp@test.com"
$cnpjA = "$timestamp".Substring(0,14)
$bodyA = @{ perfil = "TENANT_ADMIN"; nome = "Admin A"; email = $emailA; senha = "password123"; nomeClinica = "Clinica A"; cnpj = $cnpjA } | ConvertTo-Json
try {
    $regReq = Invoke-WebRequest -Uri "$url/api/auth/register" -Method Post -Body $bodyA -ContentType "application/json" -Headers @{ "Origin" = $origin } -SessionVariable sessA
    Write-Host "STATUS: $($regReq.StatusCode) (PASS)"
    $jwtA = ($regReq.Content | ConvertFrom-Json).accessToken
    $cookieA = $regReq.Headers["Set-Cookie"]
    Write-Host "JWT Recebido: $(if($jwtA){'SIM'}else{'NAO'})"
    Write-Host "Cookie Recebido: $(if($cookieA -match 'refreshToken'){'SIM'}else{'NAO'})"
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode) (FAIL)"
    $stream = $_.Exception.Response.GetResponseStream()
    if($stream) { $reader = New-Object System.IO.StreamReader($stream); Write-Host "Erro: $($reader.ReadToEnd())" }
    exit
}

Write-Host "`n=== TESTE 2: /usuarios/me ==="
try {
    $meReq = Invoke-WebRequest -Uri "$url/api/usuarios/me" -Method Get -Headers @{ "Origin" = $origin; "Authorization" = "Bearer $jwtA" } -WebSession $sessA
    Write-Host "STATUS: $($meReq.StatusCode) (PASS)"
    $meDataA = $meReq.Content | ConvertFrom-Json
    Write-Host "TenantId: $($meDataA.tenantId)"
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode) (FAIL)"
}

Write-Host "`n=== TESTE 3: LOGIN ==="
$loginBody = @{ email = $emailA; senha = "password123" } | ConvertTo-Json
try {
    $loginReq = Invoke-WebRequest -Uri "$url/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -Headers @{ "Origin" = $origin } -SessionVariable sessALogin
    Write-Host "STATUS: $($loginReq.StatusCode) (PASS)"
    $jwtALogin = ($loginReq.Content | ConvertFrom-Json).accessToken
    $cookieALogin = $loginReq.Headers["Set-Cookie"]
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode) (FAIL)"
    $stream = $_.Exception.Response.GetResponseStream()
    if($stream) { $reader = New-Object System.IO.StreamReader($stream); Write-Host "Erro: $($reader.ReadToEnd())" }

    Write-Host "`n--- DEBUG LOGIN FETCH ---"
    try {
        $dbgReq = Invoke-WebRequest -Uri "$url/api/auth/debug-login?email=$emailA" -Method Get -Headers @{ "Origin" = $origin }
        Write-Host $dbgReq.Content
    } catch {
        Write-Host "DEBUG FAILED: $($_.Exception.Message)"
    }
}

Write-Host "`n=== TESTE 4: REFRESH ==="
try {
    # Using the cookie from register as login failed previously
    $refReq = Invoke-WebRequest -Uri "$url/api/auth/refresh" -Method Post -Headers @{ "Origin" = $origin } -WebSession $sessA
    Write-Host "STATUS: $($refReq.StatusCode) (PASS)"
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode) (FAIL)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Erro: $($reader.ReadToEnd())"
}

Write-Host "`n=== TESTE 6: LOGOUT ==="
try {
    $outReq = Invoke-WebRequest -Uri "$url/api/auth/logout" -Method Post -Headers @{ "Origin" = $origin } -WebSession $sessA
    Write-Host "STATUS: $($outReq.StatusCode) (PASS)"
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode) (FAIL)"
    $stream = $_.Exception.Response.GetResponseStream()
    if($stream) { $reader = New-Object System.IO.StreamReader($stream); Write-Host "Erro: $($reader.ReadToEnd())" }
}

Write-Host "`n=== TESTE 9: TENANT ISOLATION ==="
$emailB = "user_B_$timestamp@test.com"
$cnpjB = "$timestamp".Substring(2,14)
$bodyB = @{ perfil = "TENANT_ADMIN"; nome = "Admin B"; email = $emailB; senha = "password123"; nomeClinica = "Clinica B"; cnpj = $cnpjB } | ConvertTo-Json
try {
    $regReqB = Invoke-WebRequest -Uri "$url/api/auth/register" -Method Post -Body $bodyB -ContentType "application/json" -Headers @{ "Origin" = $origin }
    Write-Host "REGISTER TENANT B STATUS: $($regReqB.StatusCode) (PASS)"
    $jwtB = ($regReqB.Content | ConvertFrom-Json).accessToken
    
    $meReqB = Invoke-WebRequest -Uri "$url/api/usuarios/me" -Method Get -Headers @{ "Origin" = $origin; "Authorization" = "Bearer $jwtB" }
    $meDataB = $meReqB.Content | ConvertFrom-Json
    Write-Host "TenantId A: $($meDataA.tenantId)"
    Write-Host "TenantId B: $($meDataB.tenantId)"
    Write-Host "ISOLATION: $(if($meDataA.tenantId -ne $meDataB.tenantId){'PASS'}else{'FAIL'})"
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode) (FAIL)"
    $stream = $_.Exception.Response.GetResponseStream()
    if($stream) { $reader = New-Object System.IO.StreamReader($stream); Write-Host "Erro: $($reader.ReadToEnd())" }
}
