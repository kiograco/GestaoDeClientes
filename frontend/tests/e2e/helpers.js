const fixtures = require('./fixtures')

async function mockApi (page, overrides = {}) {
  const state = { ...fixtures, ...overrides }
  const json = (route, body, status = 200) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body)
    })

  await page.route(/\/auth\/login\/?$/, route => json(route, state.user))
  await page.route(/\/auth\/branding(\?.*)?$/, route =>
    json(route, { logoUrl: state.user.logoUrl || null })
  )
  await page.route('**/contacts**', async route => {
    const method = route.request().method()
    if (method === 'GET') {
      return json(route, {
        contacts: [state.contact],
        count: 1,
        hasMore: false
      })
    }
    if (method === 'POST' || method === 'PUT') {
      return json(route, state.contact)
    }
    return json(route, { message: 'Contact deleted' })
  })
  await page.route('**/sales/address/cep/*', route =>
    json(route, {
      logradouro: 'Rua Nova OS',
      bairro: 'Centro',
      localidade: 'Sao Paulo',
      uf: 'SP',
      complemento: ''
    })
  )
  await page.route('**/sales/customers**', async route => {
    const method = route.request().method()
    if (method === 'GET') return json(route, [state.contact])
    if (method === 'POST') return json(route, state.newCustomer, 201)
    if (method === 'PUT') return json(route, state.newCustomer)
    return json(route, state.newCustomer)
  })
  await page.route('**/tickets**', route =>
    json(route, { tickets: [state.ticket], count: 1, hasMore: false })
  )
  await page.route('**/service/attendants**', route => {
    if (route.request().method() === 'GET') return json(route, [state.serviceAttendant])
    return json(route, state.serviceAttendant, 201)
  })
  await page.route('**/service/orders-dashboard**', route =>
    json(route, {
      total: 1,
      scheduled: 1,
      completed: 0,
      canceled: 0,
      late: 0,
      averageServiceMinutes: 60,
      cancellationRate: 0,
      byStatus: { agendada: 1 },
      byAttendant: { [state.serviceAttendant.name]: 1 },
      byServiceType: { [state.serviceOrder.serviceType]: 1 }
    })
  )
  await page.route('**/service/orders**', route => {
    if (route.request().method() === 'GET') return json(route, [state.serviceOrder])
    return json(route, state.serviceOrder, 201)
  })
  await page.route('**/delivery/categories**', route => {
    if (route.request().method() === 'GET') return json(route, [state.category])
    return json(route, state.category, 201)
  })
  await page.route('**/delivery/products**', route => {
    if (route.request().method() === 'GET') return json(route, [state.product])
    return json(route, state.product, 201)
  })
  await page.route('**/delivery/orders/*/status', async route => {
    const body = route.request().postDataJSON()
    return json(route, { ...state.order, status: body.status })
  })
  await page.route('**/delivery/orders**', route => {
    if (route.request().method() === 'GET') return json(route, [state.order])
    return json(route, state.order, 201)
  })
}

async function login (page, user = fixtures.user) {
  await mockApi(page, { user })
  await page.goto('/#/login')
  await page.locator('input[type="text"], input[type="email"]').first().fill(user.email)
  await page.locator('input[type="password"]').first().fill('123456')
  await page.getByRole('button', { name: /entrar|login|acessar/i }).click()
  await page.waitForFunction(
    username => localStorage.getItem('username') === username,
    user.username
  )
}

module.exports = { mockApi, login }
