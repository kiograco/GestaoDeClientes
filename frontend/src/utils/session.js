import { Dark } from 'quasar'

const pesquisaTicketsFiltroPadrao = {
  searchParam: '',
  pageNumber: 1,
  status: ['open', 'pending'],
  showAll: false,
  count: null,
  queuesIds: [],
  withUnreadMessages: false,
  isNotAssignedUser: false,
  includeNotQueueDefined: true
}

export const persistSessionData = data => {
  if (!data) return
  const publicSessionData = { ...data }
  delete publicSessionData.token

  localStorage.setItem('username', publicSessionData.username)
  localStorage.setItem('profile', publicSessionData.profile)
  localStorage.setItem('userId', publicSessionData.userId)
  localStorage.setItem('usuario', JSON.stringify(publicSessionData))
  localStorage.setItem('queues', JSON.stringify(publicSessionData.queues || []))

  if (publicSessionData.logoUrl) {
    localStorage.setItem('tenantLogoUrl', publicSessionData.logoUrl)
  } else {
    localStorage.removeItem('tenantLogoUrl')
  }

  localStorage.setItem('filtrosAtendimento', JSON.stringify(pesquisaTicketsFiltroPadrao))

  if (publicSessionData?.configs?.filtrosAtendimento) {
    localStorage.setItem('filtrosAtendimento', JSON.stringify(publicSessionData.configs.filtrosAtendimento))
  }

  if (publicSessionData?.configs?.isDark !== undefined) {
    Dark.set(publicSessionData.configs.isDark)
  }
}
