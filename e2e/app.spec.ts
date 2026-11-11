import { expect, test } from '@playwright/test';

test('el inicio muestra los botones de crear cuenta e iniciar sesión', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

test('el login avisa cuando el correo no es válido', async ({ page }) => {
  await page.goto('/login');

  const campos = page.locator('ion-input input');
  await campos.nth(0).fill('no-es-un-correo');
  await campos.nth(1).fill('123456');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.locator('ion-toast')).toContainText('Ingresa un correo electrónico válido');
});

test('sin sesión, las rutas privadas devuelven al inicio', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/inicio$/);
});
