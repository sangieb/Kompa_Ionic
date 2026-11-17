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

test('el registro muestra el consentimiento y abre el documento legal', async ({ page }) => {
  await page.goto('/registro');

  await expect(page.getByRole('heading', { name: 'Antes de continuar' })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('ion-checkbox')).toHaveCount(2);

  await page.getByRole('button', { name: 'Leer Términos y Condiciones y autorización de datos' }).click();

  await expect(page.getByText('Términos y privacidad')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('facingenieria@usco.edu.co').first()).toBeVisible();

  await page.getByRole('button', { name: 'Entendido' }).click();
  await expect(page.getByText('Términos y privacidad')).toBeHidden();
});
