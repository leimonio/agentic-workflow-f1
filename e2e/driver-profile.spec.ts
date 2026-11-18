import { expect, test } from '@playwright/test'

test('driver profile opens directly with heading and results table', async ({ page }) => {
  await page.goto('/drivers/norris')
  await expect(page.getByRole('heading', { level: 1, name: /Norris/ })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
})

test('unknown driver shows a not-found message', async ({ page }) => {
  await page.goto('/drivers/nobody')
  await expect(page.getByRole('heading', { name: 'Driver not found' })).toBeVisible()
})
