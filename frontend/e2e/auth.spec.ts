import { test, expect } from '@playwright/test';

test('has title and login works', async ({ page }) => {
  await page.goto('/');

  // Should redirect to login or show the app
  await expect(page).toHaveTitle(/ClickSmile/);
  
  // Try navigating to login explicitly
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
});
