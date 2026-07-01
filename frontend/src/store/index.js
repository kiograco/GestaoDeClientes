import { createStore } from 'vuex'
import user from './modules/user'
import whatsapp from './modules/whatsapp'
import atendimentoTicket from './modules/atendimentoTicket'
import notifications from './modules/Notifications'
import chatFlow from './modules/chatFlow'
import usersApp from './modules/usersApp'
import getters from './getters'

export default function (/* { ssrContext } */) {
  const Store = createStore({
    getters,
    modules: {
      user,
      notifications,
      atendimentoTicket,
      whatsapp,
      chatFlow,
      usersApp
    },

    strict: process.env.DEBUGGING
  })

  return Store
}
