const url = 'https://clicksmile-backend.onrender.com';
const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://click-smile.vercel.app'
};

async function run() {
    console.log("=== REGISTER ===");
    const email = `admine2e${Date.now()}@test.com`;
    const regRes = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            perfil: "TENANT_ADMIN",
            nome: "Admin E2E",
            email: email,
            senha: "password123",
            nomeClinica: "Clinica E2E",
            cnpj: "99123123000199"
        })
    });
    
    console.log(`STATUS: ${regRes.status}`);
    const cookie = regRes.headers.get('set-cookie');
    console.log(`SET-COOKIE: ${cookie}`);
    const regJson = await regRes.text();
    console.log(`BODY: ${regJson}`);
    console.log(`CORS ORIGIN: ${regRes.headers.get('access-control-allow-origin')}`);
    console.log(`CORS CREDENTIALS: ${regRes.headers.get('access-control-allow-credentials')}`);
    
    if (regRes.status !== 200) return;
    const jwt = JSON.parse(regJson).accessToken;

    console.log("\n=== /usuarios/me ===");
    const meRes = await fetch(`${url}/api/usuarios/me`, {
        method: 'GET',
        headers: {
            ...headers,
            'Authorization': `Bearer ${jwt}`
        }
    });
    console.log(`STATUS: ${meRes.status}`);
    console.log(`BODY: ${await meRes.text()}`);

    console.log("\n=== LOGIN ===");
    const logRes = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            email: email,
            senha: "password123"
        })
    });
    console.log(`STATUS: ${logRes.status}`);
    const loginCookie = logRes.headers.get('set-cookie');
    console.log(`SET-COOKIE: ${loginCookie}`);
    console.log(`BODY: ${await logRes.text()}`);

    console.log("\n=== REFRESH ===");
    const refRes = await fetch(`${url}/api/auth/refresh`, {
        method: 'POST',
        headers: {
            ...headers,
            'Cookie': loginCookie // simulating browser sending cookie
        }
    });
    console.log(`STATUS: ${refRes.status}`);
    const refCookie = refRes.headers.get('set-cookie');
    console.log(`SET-COOKIE: ${refCookie}`);
    console.log(`BODY: ${await refRes.text()}`);
    
    console.log("\n=== LOGOUT ===");
    const logoutRes = await fetch(`${url}/api/auth/logout`, {
        method: 'POST',
        headers: {
            ...headers,
            'Cookie': refCookie
        }
    });
    console.log(`STATUS: ${logoutRes.status}`);
    console.log(`SET-COOKIE: ${logoutRes.headers.get('set-cookie')}`);
    
    console.log("\n=== /usuarios/me APÓS LOGOUT (Teste 401) ===");
    const meRes2 = await fetch(`${url}/api/usuarios/me`, {
        method: 'GET',
        headers: {
            ...headers,
            'Authorization': `Bearer ${jwt}`
        }
    });
    console.log(`STATUS: ${meRes2.status}`);
    console.log(`BODY: ${await meRes2.text()}`);
}

run().catch(console.error);
