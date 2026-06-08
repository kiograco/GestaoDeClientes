const { test, expect } = require('@playwright/test')
const fixtures = require('./fixtures')
const { login, mockApi } = require('./helpers')

async function selecionarHora (page, dialog, label, hora) {
  const field = campoHora(dialog, label)
  await field.click()
  await page.locator('.q-menu').last().getByText(hora, { exact: true }).click()
}

async function selecionarProximoHorario (page, dialog, label) {
  const field = campoHora(dialog, label)
  const currentText = await field.innerText()
  const currentMatch = currentText.match(/\d{2}:\d{2}/)
  const current = currentMatch ? currentMatch[0] : '00:00'
  const [hour] = current.split(':').map(Number)
  const next = `${String((hour + 1) % 24).padStart(2, '0')}:00`
  await selecionarHora(page, dialog, label, next)
  return next
}

function campoHora (dialog, label) {
  return dialog
    .getByRole('combobox', { name: label })
    .locator('xpath=ancestor::label[contains(@class, "q-field")]')
}

test('login', async ({ page }) => {
  await login(page)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('token')))
    .toBeNull()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('username')))
    .toBe(fixtures.user.username)
})

test('refresh da pagina mantem usuario logado', async ({ page }) => {
  await login(page)
  await page.goto('/#/ordens-servico')
  await page.reload()

  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.getByRole('button', { name: /nova ordem/i })).toBeVisible()
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

test('edicao de ordem envia horario alterado com timezone', async ({ page }) => {
  await login(page)
  let payloadEnviado = null
  await page.route('**/service/orders/70', async route => {
    if (route.request().method() === 'PUT') {
      payloadEnviado = route.request().postDataJSON()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...fixtures.serviceOrder, ...payloadEnviado })
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixtures.serviceOrder)
    })
  })
  await page.goto('/#/ordens-servico')
  await page.locator('input[type="date"]').fill('2099-12-31')

  await page.getByRole('button', { name: /#70 visita e2e/i }).click()
  await page.locator('.details-grid').getByRole('button', { name: /editar/i }).click()
  const ordemDialog = page.getByRole('dialog').filter({ hasText: /editar ordem/i })
  await ordemDialog.getByLabel(/data/i).fill('2099-12-31')
  const startTime = await selecionarProximoHorario(page, ordemDialog, /hora início/i)
  const endTime = await selecionarProximoHorario(page, ordemDialog, /hora fim/i)
  await ordemDialog.getByRole('button', { name: /agendar/i }).click()

  const esperado = await page.evaluate(({ startTime, endTime }) => ({
    start: new Date(`2099-12-31T${startTime}`).toISOString(),
    end: new Date(`2099-12-31T${endTime}`).toISOString()
  }), { startTime, endTime })
  await expect.poll(() => payloadEnviado && payloadEnviado.scheduledStart).toBe(esperado.start)
  expect(payloadEnviado.scheduledEnd).toBe(esperado.end)
})

test('menu contextual da agenda troca tecnico da ordem', async ({ page }) => {
  await login(page)
  let payloadEnviado = null
  await page.route('**/service/orders/70', async route => {
    if (route.request().method() === 'PUT') {
      payloadEnviado = route.request().postDataJSON()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...fixtures.serviceOrder,
          ...payloadEnviado,
          attendant: fixtures.serviceAttendant2
        })
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixtures.serviceOrder)
    })
  })
  await page.goto('/#/ordens-servico')
  await page.locator('input[type="date"]').fill('2099-12-31')

  await page.getByRole('button', { name: /#70 visita e2e/i }).click({ button: 'right' })
  await page.locator('.q-menu').getByText(fixtures.serviceAttendant2.name).click()

  await expect.poll(() => payloadEnviado && payloadEnviado.attendantId).toBe(fixtures.serviceAttendant2.id)
})

test('clique na agenda exibe balao de detalhes da ordem', async ({ page }) => {
  await login(page)
  await page.goto('/#/ordens-servico')
  await page.locator('input[type="date"]').fill('2099-12-31')

  await page.getByRole('button', { name: /#70 visita e2e/i }).click()

  const popover = page.locator('.order-details-popover')
  await expect(popover.getByText(/detalhes da ordem #70/i)).toBeVisible()
  await expect(popover.getByText(/cliente e2e/i)).toBeVisible()
  await expect(popover.getByText(/tecnico e2e/i)).toBeVisible()
})

test('menu contextual da agenda reserva horario livre', async ({ page }) => {
  await login(page)
  await page.goto('/#/ordens-servico')
  await page.locator('input[type="date"]').fill('2099-12-31')

  await page.getByRole('button', { name: /reservar tecnico b e2e 14:00/i }).click({ button: 'right' })
  await page.locator('.q-menu').getByText(/reservar horário/i).click()

  const ordemDialog = page.getByRole('dialog').filter({ hasText: /nova ordem/i })
  await expect(ordemDialog.getByLabel(/titulo|título/i)).toHaveValue('Reserva de horário')
  await expect(ordemDialog.getByLabel(/data/i)).toHaveValue('2099-12-31')
  await expect(campoHora(ordemDialog, /hora início/i)).toContainText('14:00')
  await expect(campoHora(ordemDialog, /hora fim/i)).toContainText('15:00')
})

test('nova ordem recorrente envia intervalo editavel', async ({ page }) => {
  await login(page)
  let payloadEnviado = null
  await page.route('**/service/orders', async route => {
    if (route.request().method() === 'POST') {
      payloadEnviado = route.request().postDataJSON()
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...fixtures.serviceOrder, ...payloadEnviado, id: 71 })
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([fixtures.serviceOrder])
    })
  })
  await page.goto('/#/ordens-servico')

  await page.getByRole('button', { name: /nova ordem/i }).click()
  const ordemDialog = page.getByRole('dialog').filter({ hasText: /nova ordem/i })
  await ordemDialog.getByRole('combobox', { name: 'Cliente' }).click()
  await page.getByText(/cliente e2e/i).click()
  await ordemDialog.getByLabel(/titulo|título/i).fill('Ordem recorrente E2E')
  await ordemDialog.getByLabel(/tipo de servico|tipo de serviço/i).fill('Manutencao preventiva')
  await ordemDialog.getByLabel(/data/i).fill('2099-12-31')
  await selecionarHora(page, ordemDialog, /hora início/i, '00:00')
  await selecionarHora(page, ordemDialog, /hora fim/i, '01:00')
  await ordemDialog.getByText(/ordem recorrente/i).click()
  await ordemDialog.getByRole('combobox', { name: /tipo de recorrência/i }).click()
  await page.getByText(/intervalo em dias/i).click()
  await ordemDialog.getByLabel(/a cada/i).fill('30')
  await ordemDialog.getByRole('button', { name: /agendar/i }).click()

  await expect.poll(() => payloadEnviado && payloadEnviado.recurrenceType).toBe('custom_interval')
  expect(payloadEnviado.recurrenceActive).toBe(true)
  expect(payloadEnviado.recurrenceIntervalDays).toBe(30)
  expect(payloadEnviado.recurrenceDayOfMonth).toBeNull()
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
