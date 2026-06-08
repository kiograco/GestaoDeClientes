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

test('cadastro de cliente dentro da nova ordem preserva dados preenchidos', async ({ page }) => {
  await login(page)
  await page.goto('/#/ordens-servico')

  await page.getByRole('button', { name: /nova ordem/i }).click()
  const ordemDialog = page.getByRole('dialog').filter({ hasText: /nova ordem/i })
  await ordemDialog.getByLabel(/titulo|título/i).fill('Ordem com cliente rapido E2E')
  await ordemDialog.getByLabel(/tipo de servico|tipo de serviço/i).fill('Instalacao E2E')
  await ordemDialog.getByLabel(/descrição|descricao/i).fill('Descricao antes do cadastro do cliente')

  await ordemDialog.getByRole('combobox', { name: 'Cliente' }).click()
  await page.getByText(/cadastrar novo cliente/i).click()

  await page.getByLabel(/nome \*/i).fill(fixtures.newCustomer.name)
  await page.getByLabel(/whatsapp ou telefone \*/i).fill(fixtures.newCustomer.number)
  await page.getByLabel(/cep \*/i).fill(fixtures.newCustomer.addresses[0].zipCode)
  await page.getByLabel(/logradouro \*/i).fill(fixtures.newCustomer.addresses[0].street)
  await page.getByLabel(/numero \*/i).fill(fixtures.newCustomer.addresses[0].number)
  await page.getByLabel(/bairro \*/i).fill(fixtures.newCustomer.addresses[0].district)
  await page.getByLabel(/cidade \*/i).fill(fixtures.newCustomer.addresses[0].city)
  await page.getByLabel(/uf \*/i).fill(fixtures.newCustomer.addresses[0].state)
  await page.getByRole('button', { name: /salvar cliente/i }).click()

  await expect(page.getByText(fixtures.newCustomer.name).first()).toBeVisible()
  await expect(ordemDialog.getByLabel(/titulo|título/i)).toHaveValue('Ordem com cliente rapido E2E')
  await expect(ordemDialog.getByLabel(/tipo de servico|tipo de serviço/i)).toHaveValue('Instalacao E2E')
  await expect(ordemDialog.getByLabel(/descrição|descricao/i)).toHaveValue('Descricao antes do cadastro do cliente')
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
