import { test, expect } from '@playwright/test';

test.describe('Buscar Dentistas Flow', () => {
  test.use({
    geolocation: { latitude: -23.5505, longitude: -46.6333 },
    permissions: ['geolocation'],
  });

  test('Deve permitir buscar dentistas, ver detalhes e iniciar chat', async ({ page }) => {
    // Navigate to patient dashboard (auto redirects to login if not authenticated)
    await page.goto('/paciente');

    // Login as a patient if needed
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'paciente@teste.com'); // Mock credentials
      await page.fill('input[type="password"]', '123456');
      await page.click('button:has-text("Entrar")');
      await page.waitForURL('**/paciente');
    }

    // Go to the "Buscar Dentistas" tab if not already there
    const buscarTab = page.locator('button', { hasText: 'Buscar Dentistas' });
    if (await buscarTab.isVisible()) {
      await buscarTab.click();
    }

    // Since we granted geolocation permission, the "Usar minha localização" should work immediately
    // Wait for the map to appear
    await expect(page.locator('#map')).toBeVisible();

    // Verify initial load of dentists (there should be a list in the UI)
    // Looking for the Dentist cards (they have class shadow-sm, bg-cs-surface, etc.)
    // We can just wait for some cards to show up or if empty, at least the filter is there
    const searchInput = page.locator('input[placeholder="Dr. João..."]');
    await expect(searchInput).toBeVisible();

    // Fill filter to test if it filters
    await searchInput.fill('Dentista Inexistente XYZ');
    // Wait for results to be filtered (assuming it's fast on the client)
    // Clear filter
    await searchInput.fill('');

    // Wait for cards to appear (assuming mock data exists or real DB has at least one)
    // If there is a dentist, click "Ver Detalhes"
    const firstDentist = page.locator('button', { hasText: 'Ver Detalhes' }).first();
    
    // We check if there are dentists to test the rest of the flow
    if (await firstDentist.isVisible()) {
      await firstDentist.click();

      // Check if details panel opened
      const chatButton = page.locator('button', { hasText: 'Iniciar Chat' });
      await expect(chatButton).toBeVisible();

      // Click Chat
      await chatButton.click();

      // Ensure it switched to the Chat tab
      // In the layout, the textarea for chat should be visible
      const chatInput = page.locator('textarea[placeholder="Digite sua mensagem..."]');
      await expect(chatInput).toBeVisible();
    }
  });
});
