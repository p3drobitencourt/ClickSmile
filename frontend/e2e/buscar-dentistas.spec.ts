import { test, expect } from '@playwright/test';

// Função para gerar CPF válido matematicamente ou string randômica formatada se a validação for frouxa
// Como o backend exige regexp ^$|^\d{11}$ , enviaremos 11 dígitos numéricos
function generateCpf() {
  return Math.floor(10000000000 + Math.random() * 90000000000).toString().substring(0, 11);
}

// Como o backend exige regexp ^$|^\d{14}$ , enviaremos 14 dígitos numéricos
function generateCnpj() {
  return Math.floor(10000000000000 + Math.random() * 90000000000000).toString().substring(0, 14);
}

function generateUser(prefix: string) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  return {
    nome: `${prefix} Teste ${timestamp} ${randomSuffix}`,
    email: `${prefix.toLowerCase()}_${timestamp}_${randomSuffix}@teste.com`,
    senha: 'password123',
    telefone: '11999999999'
  };
}

test.describe('Buscar Dentistas Flow', () => {
  let pacienteCredentials: any;
  let dentistaCredentials: any;

  test.use({
    geolocation: { latitude: -23.5505, longitude: -46.6333 },
    permissions: ['geolocation'],
  });

  test.beforeAll(async ({ request }) => {
    pacienteCredentials = generateUser('Paciente');
    dentistaCredentials = generateUser('Dentista');

    // Registra o Dentista usando o endpoint real
    const dentistaRes = await request.post('http://127.0.0.1:8080/api/auth/register', {
      data: {
        perfil: 'DENTISTA',
        nome: dentistaCredentials.nome,
        email: dentistaCredentials.email,
        senha: dentistaCredentials.senha,
        telefone: dentistaCredentials.telefone,
        especialidade: 'Ortodontia',
        cro: `CRO-${Date.now().toString().slice(-6)}`,
        nomeClinica: 'Clinica Teste',
        cnpj: generateCnpj(),
        cpf: generateCpf()
      }
    });

    if (!dentistaRes.ok()) {
      console.error('Falha ao registrar DENTISTA. Status:', dentistaRes.status());
      console.error('Body:', await dentistaRes.text());
    }
    expect(dentistaRes.ok()).toBeTruthy();
    const dentistaData = await dentistaRes.json();
    const accessToken = dentistaData.accessToken;

    const profileRes = await request.get('http://127.0.0.1:8080/api/usuarios/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    expect(profileRes.ok()).toBeTruthy();
    const profileData = await profileRes.json();
    const clinicId = profileData.tenantId;

    // Registra o Paciente
    const pacienteRes = await request.post('http://127.0.0.1:8080/api/auth/register', {
      data: {
        perfil: 'PACIENTE',
        nome: pacienteCredentials.nome,
        email: pacienteCredentials.email,
        senha: pacienteCredentials.senha,
        telefone: pacienteCredentials.telefone,
        cpf: generateCpf(),
        tenantId: clinicId
      }
    });

    if (!pacienteRes.ok()) {
      console.error('Falha ao registrar PACIENTE. Status:', pacienteRes.status());
      console.error('Body:', await pacienteRes.text());
    }
    expect(pacienteRes.ok()).toBeTruthy();
  });

  test('Deve permitir buscar dentistas, ver detalhes e iniciar chat', async ({ page }) => {
    await page.goto('/login');

    // Autenticar com o paciente criado
    await page.fill('input[type="email"]', pacienteCredentials.email);
    await page.fill('input[type="password"]', pacienteCredentials.senha);
    await page.click('button:has-text("Entrar")');
    
    // Confirmar redirecionamento real
    await page.waitForURL('**/paciente');
    expect(page.url()).toContain('/paciente');

    // Navegar para Buscar Dentistas
    const buscarTab = page.locator('button', { hasText: 'Buscar Dentistas' });
    if (await buscarTab.isVisible()) {
      await buscarTab.click();
    }

    // Confirmar que o mapa real foi renderizado
    await expect(page.locator('#dentist-map')).toBeVisible();

    // Filtra pelo dentista que acabamos de criar para focar o teste
    const searchInput = page.locator('input[placeholder="Dr. João..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(dentistaCredentials.nome);

    // Confirma que a busca real retornou o dentista criado (deve existir obrigatoriamente)
    // O locator do texto com o nome garante que é o card certo
    const cardDentista = page.locator(`text=${dentistaCredentials.nome}`).first();
    await expect(cardDentista).toBeVisible({ timeout: 15000 });

    // Localizar botão de detalhes dentro desse card, ou de forma genérica
    const detalhesButton = page.locator('button', { hasText: 'Ver Detalhes' }).first();
    await expect(detalhesButton).toBeVisible();
    await detalhesButton.click();

    // Validar detalhes abertos
    const chatButton = page.locator('button', { hasText: 'Iniciar Chat' });
    await expect(chatButton).toBeVisible();

    // Observar o envio da requisição de POST /api/chat/iniciar sem interceptar
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/chat/iniciar') && response.request().method() === 'POST'
    );

    // Clicar para Iniciar Chat
    await chatButton.click();

    // Aguardar a resposta real e validar
    const chatInitResponse = await responsePromise;
    if (!chatInitResponse.ok()) {
      console.error('Falha no iniciar chat. Body:', await chatInitResponse.text());
    }
    expect(chatInitResponse.ok()).toBeTruthy();

    // Validar que o textarea aparece para enviar mensagem
    const chatInput = page.locator('textarea[placeholder="Digite sua mensagem..."]');
    await expect(chatInput).toBeVisible();
    
    // Simular o envio da mensagem
    await chatInput.fill('Olá, tudo bem?');
    await expect(chatInput).toHaveValue('Olá, tudo bem?');
    
    // Como a funcionalidade real de "Enviar" usa o componente para enviar pelo WebSocket e adiciona à UI:
    const sendButton = page.locator('button', { hasText: 'Enviar' });
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Validar que a mensagem apareceu na lista de mensagens (UI real conectada)
    const chatMessage = page.locator('text=Olá, tudo bem?').first();
    await expect(chatMessage).toBeVisible();
  });
});
