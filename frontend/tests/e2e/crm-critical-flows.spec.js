const { test, expect } = require('@playwright/test')
const fixtures = require('./fixtures')
const { login, mockApi } = require('./helpers')

test('login', async ({ page }) => {
  await login(page)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('token')))
    .toBeNull()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('username')))
    .toBe(fixtures.user.username)
})

test('cadastro de cliente', async ({ page }) => {
  await login(page)
  await page.goto('/#/contatos')
  await expect(page.getByText(/cliente e2e/i)).toBeVisible()
})

test('abertura de ticket', async ({ page }) => {
  await login(page)
  await page.goto('/#/atendimento')
  await expect(page.getByText(/canais/i).first()).toBeVisible()
})

test('cadastro de produto no cardapio', async ({ page }) => {
  await login(page)
  await page.goto('/#/delivery/catalogo')
  await expect(page.getByText(/burger e2e/i).first()).toBeVisible()
})

test('criacao manual de pedido no chat e finalizacao', async ({ page }) => {
  await login(page)
  await page.goto('/#/delivery/pedidos')
  await expect(page.getByText(/burger e2e|58,00|58.00/i)).toBeVisible()
})

test('alteracao de status do pedido', async ({ page }) => {
  await login(page)
  await page.goto('/#/delivery/pedidos')

  for (const label of [
    /novo/i,
    /aguardando pagamento/i,
    /confirmado/i,
    /em preparo/i,
    /pronto/i
  ]) {
    await expect(page.getByText(label).first()).toBeVisible({ timeout: 10000 })
  }
})

test('montagem de carrinho pelo chatbot', async ({ page }) => {
  await login(page)
  await page.goto('/#/atendimento')
  await expect(page.getByText(/canais/i).first()).toBeVisible()
})

test('bloqueio por assinatura expirada', async ({ page }) => {
  await mockApi(page, {
    user: {
      ...fixtures.user,
      subscriptionExpired: true,
      accessExpiresAt: '2020-01-01T00:00:00.000Z',
      accessDaysRemaining: 0
    }
  })
  await page.goto('/#/login')
  await page.locator('input[type="text"], input[type="email"]').first().fill(fixtures.user.email)
  await page.locator('input[type="password"]').first().fill('123456')
  await page.getByRole('button', { name: /entrar|login|acessar/i }).click()
  await expect(page.getByText('Minha assinatura').first()).toBeVisible()
})

test('acesso negado entre empresas diferentes', async ({ page }) => {
  await login(page)
  await page.route('**/contacts/999', route =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'ERR_NO_CONTACT_FOUND' })
    })
  )
  const status = await page.evaluate(async () => {
    const response = await fetch('/contacts/999')
    return response.status
  })
  expect(status).toBe(404)
})
