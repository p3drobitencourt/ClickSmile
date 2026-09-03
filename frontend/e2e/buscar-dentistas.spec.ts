import { test, expect } from '@playwright/test';

// Function to generate a random user to avoid conflicts
function generateUser(prefix: string) {
  const timestamp = Date.now();
  return {
    nome: `${prefix} Teste ${timestamp}`,
    email: `${prefix.toLowerCase()}_${timestamp}@teste.com`,
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
    // Generate real unique users for this test run
    pacienteCredentials = generateUser('Paciente');
    dentistaCredentials = generateUser('Dentista');

    // Register a Dentist to ensure there is at least one in the directory
    await request.post('/api/public/auth/register', {
      data: {
        perfil: 'DENTISTA',
        nome: dentistaCredentials.nome,
        email: dentistaCredentials.email,
        senha: dentistaCredentials.senha,
        telefone: dentistaCredentials.telefone,
        especialidade: 'Ortodontia',
        cro: '12345'
      }
    });

    // Register a Patient
    await request.post('/api/public/auth/register', {
      data: {
        perfil: 'PACIENTE',
        nome: pacienteCredentials.nome,
        email: pacienteCredentials.email,
        senha: pacienteCredentials.senha,
        telefone: pacienteCredentials.telefone
      }
    });
  });

  test('Deve permitir buscar dentistas, ver detalhes e iniciar chat', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Login with dynamically created Patient
    await page.fill('input[type="email"]', pacienteCredentials.email);
    await page.fill('input[type="password"]', pacienteCredentials.senha);
    await page.click('button:has-text("Entrar")');
    
    // Wait to be redirected to /paciente
    await page.waitForURL('**/paciente');

    // Go to the "Buscar Dentistas" tab if not already there
    const buscarTab = page.locator('button', { hasText: 'Buscar Dentistas' });
    if (await buscarTab.isVisible()) {
      await buscarTab.click();
    }

    // Since we granted geolocation permission, the "Usar minha localização" will work if we click it
    // Wait for the map to appear using the correct selector
    await expect(page.locator('#dentist-map')).toBeVisible();

    // Verify initial load of dentists (there should be a list in the UI)
    const searchInput = page.locator('input[placeholder="Dr. João..."]');
    await expect(searchInput).toBeVisible();

    // The created Dentist should appear in the results
    // We expect at least one "Ver Detalhes" button
    const detalhesButton = page.locator('button', { hasText: 'Ver Detalhes' }).first();
    await expect(detalhesButton).toBeVisible({ timeout: 10000 });

    // Click "Ver Detalhes" to open the sidebar
    await detalhesButton.click();

    // Check if details panel opened by verifying the Chat button exists
    const chatButton = page.locator('button', { hasText: 'Iniciar Chat' });
    await expect(chatButton).toBeVisible();

    // Click Chat
    await chatButton.click();

    // Ensure it switched to the Chat tab and textarea is visible
    const chatInput = page.locator('textarea[placeholder="Digite sua mensagem..."]');
    await expect(chatInput).toBeVisible();
    
    // Test typing a message
    await chatInput.fill('Olá, tudo bem?');
    await expect(chatInput).toHaveValue('Olá, tudo bem?');
  });
});
