const token = 'e2e-token'

const tenant = {
  tenantId: 1,
  tenantName: 'Empresa E2E',
  businessType: 'delivery',
  enabledModules: { delivery: true },
  accessExpiresAt: '2099-12-31T23:59:59.000Z',
  accessDaysRemaining: 999,
  subscriptionExpired: false
}

const user = {
  token,
  username: 'Admin E2E',
  email: 'admin@example.test',
  profile: 'admin',
  status: 'online',
  userId: 1,
  queues: [],
  configs: {},
  ...tenant
}

const contact = {
  id: 10,
  name: 'Cliente E2E',
  number: '5511999990000',
  email: 'cliente@example.test',
  tenantId: 1
}

const ticket = {
  id: 20,
  status: 'open',
  channel: 'whatsapp',
  contactId: contact.id,
  contact,
  lastMessage: 'Quero fazer um pedido'
}

const category = {
  id: 30,
  name: 'Lanches',
  description: 'Cardapio E2E',
  isActive: true
}

const product = {
  id: 40,
  categoryId: category.id,
  name: 'Burger E2E',
  description: 'Burger com queijo',
  basePrice: '25.00',
  available: true,
  optionGroups: []
}

const order = {
  id: 50,
  contactId: contact.id,
  ticketId: ticket.id,
  originChannel: 'manual',
  deliveryType: 'delivery',
  status: 'NEW',
  subtotal: '50.00',
  deliveryFee: '8.00',
  discount: '0.00',
  total: '58.00',
  contact,
  items: [
    {
      id: 1,
      productNameSnapshot: product.name,
      quantity: 2,
      total: '50.00'
    }
  ]
}

const serviceAttendant = {
  id: 60,
  name: 'Tecnico E2E',
  email: 'tecnico@example.test',
  phone: '5511988880000',
  specialty: 'Instalacao',
  active: true
}

const serviceAttendant2 = {
  id: 61,
  name: 'Tecnico B E2E',
  email: 'tecnico-b@example.test',
  phone: '5511988880001',
  specialty: 'Manutencao',
  active: true
}

const serviceOrder = {
  id: 70,
  contactId: contact.id,
  attendantId: serviceAttendant.id,
  title: 'Visita E2E',
  description: 'Descricao da visita E2E',
  serviceType: 'Instalacao',
  priority: 'baixa',
  status: 'agendada',
  recurrenceActive: false,
  recurrenceType: 'single',
  recurrenceDayOfMonth: null,
  recurrenceIntervalDays: null,
  scheduledStart: '2099-12-31T10:00:00.000Z',
  scheduledEnd: '2099-12-31T11:00:00.000Z',
  address: 'Rua E2E, 100',
  city: 'Sao Paulo',
  state: 'SP',
  zipCode: '01001000',
  publicObservation: '',
  internalObservation: '',
  contact,
  attendant: serviceAttendant
}

const newCustomer = {
  id: 80,
  name: 'Cliente Novo OS E2E',
  number: '5511977770000',
  email: 'novo-os@example.test',
  tenantId: 1,
  salesProfile: {
    salesStatus: 'CUSTOMER',
    companyName: 'Empresa Nova OS'
  },
  addresses: [
    {
      id: 81,
      contactId: 80,
      label: 'Principal',
      zipCode: '01001000',
      street: 'Rua Nova OS',
      number: '123',
      district: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      complement: '',
      reference: ''
    }
  ]
}

module.exports = {
  token,
  user,
  tenant,
  contact,
  ticket,
  category,
  product,
  order,
  serviceAttendant,
  serviceAttendant2,
  serviceAttendants: [serviceAttendant, serviceAttendant2],
  serviceOrder,
  newCustomer
}
