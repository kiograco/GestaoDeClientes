import { RealizarLogin } from '../../service/login'
import { Notify } from 'quasar'
import { socketIO } from 'src/utils/socket'
import { setAccessToken } from 'src/utils/authToken'
import { persistSessionData } from 'src/utils/session'

const socket = socketIO()

const user = {
  state: {
    token: null,
    isAdmin: false,
    isSuporte: false
  },
  mutations: {
    SET_IS_SUPORTE (state, payload) {
      const domains = ['@']
      let authorized = false
      domains.forEach(domain => {
        if (payload?.email.toLocaleLowerCase().indexOf(domain.toLocaleLowerCase()) !== -1) {
          authorized = true
        }
      })
      state.isSuporte = authorized
    },
    SET_IS_ADMIN (state, payload) {
      state.isAdmin = !!((state.isSuporte || payload.profile === 'admin'))
    }
  },
  actions: {
    async UserLogin ({ commit, dispatch }, user) {
      user.email = user.email.trim()
      try {
        const { data } = await RealizarLogin(user)
        setAccessToken(data.token)
        persistSessionData(data)
        commit('SET_IS_SUPORTE', data)
        commit('SET_IS_ADMIN', data)

        if (data.profile !== 'superadmin' && !data.subscriptionExpired) {
          socket.emit(`${data.tenantId}:setUserActive`)
        }

        Notify.create({
          type: 'positive',
          message: 'Login realizado com sucesso!',
          position: 'top',
          progress: true
        })

        if (data.subscriptionExpired) {
          this.$router.push({
            name: 'minha-assinatura'
          })
        } else if (data.profile === 'superadmin') {
          this.$router.push({
            name: 'superadmin-empresas'
          })
        } else if (data.profile === 'admin') {
          this.$router.push({
            name: 'home-dashboard'
          })
        } else {
          this.$router.push({
            name: 'atendimento'
          })
        }
      } catch (error) {
        console.error(error)
      }
    }
  }
}

export default user
