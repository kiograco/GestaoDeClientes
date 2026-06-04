import { Notify } from 'quasar'
import Errors from 'src/utils/errors'

export const notificarErro = (msg, error = null) => {
  let erro = ''
  if (error) {
    erro = error?.data?.error || error?.data?.msg || error?.data?.message || error?.response?.data.error || 'Não identificado'
  }
  const findErro = Errors.find(e => e.error == erro)
  let message = ''

  if (error && findErro?.error) {
    message = `${findErro.description}. ${findErro.detail}`
  } else {
    message = `${msg}. Detail: ${erro}`
  }

  Notify.create({
    type: 'negative',
    progress: true,
    position: 'top',
    timeout: 500,
    message,
    actions: [{
      icon: 'close',
      round: true,
      color: 'white'
    }]
  })
  throw new Error(message)
}

export const notificarSucesso = (msg) => {
  const message = `Tudo certo... ${msg}.`
  Notify.create({
    type: 'positive',
    progress: true,
    position: 'top',
    message,
    timeout: 500,
    actions: [{
      icon: 'close',
      round: true,
      color: 'white'
    }]
  })
}
