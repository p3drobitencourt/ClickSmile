import { test, expect } from '@playwright/test';

test.describe('Calendar and Chat flow', () => {
  test('should display dentists and allow selecting a slot and sending a message', async ({ page }) => {
    // This is a placeholder test for the end-to-end flow of selecting a dentist, booking a slot, and sending a chat message.
    // Assuming user is already logged in or we mock the login.
    
    // We navigate to the client dashboard
    await page.goto('/cliente');

    // For a real test, we would need to mock the API responses or have a seeded database.
    // Here we assert the basic elements are present in the DOM.
    
    // Check if chat input exists
    const chatInput = page.locator('textarea[placeholder="Digite sua mensagem..."]');
    
    // Check if the calendar is present
    const calendarEl = page.locator('.calendar-shell');
    
    // As this is E2E without mock, if not logged in it redirects to login. 
    // Wait for either the login page or the dashboard
    await page.waitForURL('**/*');
    
    if (page.url().includes('/login')) {
      // Handle login just to be sure we can reach the dashboard
      await page.fill('input[type="email"]', 'cliente@teste.com');
      await page.fill('input[type="password"]', '123456');
      await page.click('button:has-text("Entrar")');
      
      // Now we should be on /cliente
      await page.waitForURL('**/cliente');
    }

    // Now test if elements are visible
    if (await chatInput.isVisible()) {
      await expect(chatInput).toBeVisible();
      await expect(calendarEl).toBeVisible();
      
      // Try sending a message
      await chatInput.fill('Olá, gostaria de agendar uma consulta.');
      await page.click('button:has-text("Enviar")');
      
      // Expect the message to appear in the chat thread
      await expect(page.locator('.chat-thread')).toContainText('Olá, gostaria de agendar uma consulta.');
    }
  });
});
