# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buscar-dentistas.spec.ts >> Buscar Dentistas Flow >> Deve permitir buscar dentistas, ver detalhes e iniciar chat
- Location: e2e\buscar-dentistas.spec.ts:106:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:8080
Call log:
  - → POST http://127.0.0.1:8080/api/auth/register
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 281

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Função para gerar CPF válido matematicamente ou string randômica formatada se a validação for frouxa
  4   | // Como o backend exige regexp ^$|^\d{11}$ , enviaremos 11 dígitos numéricos
  5   | function generateCpf() {
  6   |   return Math.floor(10000000000 + Math.random() * 90000000000).toString().substring(0, 11);
  7   | }
  8   | 
  9   | // Como o backend exige regexp ^$|^\d{14}$ , enviaremos 14 dígitos numéricos
  10  | function generateCnpj() {
  11  |   return Math.floor(10000000000000 + Math.random() * 90000000000000).toString().substring(0, 14);
  12  | }
  13  | 
  14  | function generateUser(prefix: string) {
  15  |   const timestamp = Date.now();
  16  |   const randomSuffix = Math.floor(Math.random() * 10000);
  17  |   return {
  18  |     nome: `${prefix} Teste ${timestamp} ${randomSuffix}`,
  19  |     email: `${prefix.toLowerCase()}_${timestamp}_${randomSuffix}@teste.com`,
  20  |     senha: 'password123',
  21  |     telefone: '11999999999'
  22  |   };
  23  | }
  24  | 
  25  | test.describe('Buscar Dentistas Flow', () => {
  26  |   let pacienteCredentials: any;
  27  |   let dentistaCredentials: any;
  28  | 
  29  |   test.use({
  30  |     geolocation: { latitude: -23.5505, longitude: -46.6333 },
  31  |     permissions: ['geolocation'],
  32  |   });
  33  | 
  34  |   test.beforeAll(async ({ request }) => {
  35  |     pacienteCredentials = generateUser('Paciente');
  36  |     dentistaCredentials = generateUser('Dentista');
  37  | 
  38  |     // Registra o Dentista usando o endpoint real
> 39  |     const dentistaRes = await request.post('http://127.0.0.1:8080/api/auth/register', {
      |                                       ^ Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:8080
  40  |       data: {
  41  |         perfil: 'DENTISTA',
  42  |         nome: dentistaCredentials.nome,
  43  |         email: dentistaCredentials.email,
  44  |         senha: dentistaCredentials.senha,
  45  |         telefone: dentistaCredentials.telefone,
  46  |         especialidade: 'Ortodontia',
  47  |         cro: `CRO-${Date.now().toString().slice(-6)}`,
  48  |         nomeClinica: 'Clinica Teste',
  49  |         cnpj: generateCnpj(),
  50  |         cpf: generateCpf()
  51  |       }
  52  |     });
  53  | 
  54  |     if (!dentistaRes.ok()) {
  55  |       console.error('Falha ao registrar DENTISTA. Status:', dentistaRes.status());
  56  |       console.error('Body:', await dentistaRes.text());
  57  |     }
  58  |     expect(dentistaRes.ok()).toBeTruthy();
  59  |     const dentistaData = await dentistaRes.json();
  60  |     const accessToken = dentistaData.accessToken;
  61  | 
  62  |     const profileRes = await request.get('http://127.0.0.1:8080/api/usuarios/me', {
  63  |       headers: { 'Authorization': `Bearer ${accessToken}` }
  64  |     });
  65  |     expect(profileRes.ok()).toBeTruthy();
  66  |     const profileData = await profileRes.json();
  67  |     const clinicId = profileData.tenantId;
  68  |     const dentistaId = profileData.id;
  69  | 
  70  |     // Obtém o perfil atual do dentista
  71  |     const getPerfilRes = await request.get(`http://127.0.0.1:8080/api/dentistas/${dentistaId}/perfil`, {
  72  |       headers: { 'Authorization': `Bearer ${accessToken}` }
  73  |     });
  74  |     expect(getPerfilRes.ok()).toBeTruthy();
  75  |     const perfilDto = await getPerfilRes.json();
  76  | 
  77  |     // Atualiza o perfil com latitude e longitude para a clínica aparecer na busca
  78  |     perfilDto.latitude = -23.5505;
  79  |     perfilDto.longitude = -46.6333;
  80  |     const putPerfilRes = await request.put(`http://127.0.0.1:8080/api/dentistas/${dentistaId}/perfil`, {
  81  |       headers: { 'Authorization': `Bearer ${accessToken}` },
  82  |       data: perfilDto
  83  |     });
  84  |     expect(putPerfilRes.ok()).toBeTruthy();
  85  | 
  86  |     // Registra o Paciente
  87  |     const pacienteRes = await request.post('http://127.0.0.1:8080/api/auth/register', {
  88  |       data: {
  89  |         perfil: 'PACIENTE',
  90  |         nome: pacienteCredentials.nome,
  91  |         email: pacienteCredentials.email,
  92  |         senha: pacienteCredentials.senha,
  93  |         telefone: pacienteCredentials.telefone,
  94  |         cpf: generateCpf(),
  95  |         tenantId: clinicId
  96  |       }
  97  |     });
  98  | 
  99  |     if (!pacienteRes.ok()) {
  100 |       console.error('Falha ao registrar PACIENTE. Status:', pacienteRes.status());
  101 |       console.error('Body:', await pacienteRes.text());
  102 |     }
  103 |     expect(pacienteRes.ok()).toBeTruthy();
  104 |   });
  105 | 
  106 |   test('Deve permitir buscar dentistas, ver detalhes e iniciar chat', async ({ page }) => {
  107 |     await page.goto('/login');
  108 | 
  109 |     // Autenticar com o paciente criado
  110 |     await page.fill('input[type="email"]', pacienteCredentials.email);
  111 |     await page.fill('input[type="password"]', pacienteCredentials.senha);
  112 |     await page.click('button:has-text("Entrar")');
  113 |     
  114 |     // Confirmar redirecionamento real
  115 |     await page.waitForURL('**/paciente/dashboard');
  116 |     expect(page.url()).toContain('/paciente/dashboard');
  117 | 
  118 |     // Navegar para Buscar Dentistas
  119 |     const buscarTab = page.locator('button', { hasText: 'Buscar Dentistas' });
  120 |     if (await buscarTab.isVisible()) {
  121 |       await buscarTab.click();
  122 |     }
  123 | 
  124 |     // Confirmar que o mapa real foi renderizado
  125 |     await expect(page.locator('#dentist-map')).toBeVisible();
  126 | 
  127 |     // Filtra pelo dentista que acabamos de criar para focar o teste
  128 |     const searchInput = page.locator('input[placeholder="Dr. João..."]');
  129 |     await expect(searchInput).toBeVisible();
  130 |     await searchInput.fill(dentistaCredentials.nome);
  131 | 
  132 |     // Confirma que a busca real retornou o dentista criado (deve existir obrigatoriamente)
  133 |     // O locator do texto com o nome garante que é o card certo
  134 |     const cardDentista = page.locator(`text=${dentistaCredentials.nome}`).first();
  135 |     await expect(cardDentista).toBeVisible({ timeout: 15000 });
  136 | 
  137 |     // Localizar botão de detalhes dentro desse card, ou de forma genérica
  138 |     const detalhesButton = page.locator('button', { hasText: 'Ver Detalhes' }).first();
  139 |     await expect(detalhesButton).toBeVisible();
```