import Vuelidate from '@vuelidate/core'
import linkifyHtml from 'linkify-html'

const linkified = {
  mounted (el, binding) {
    el.innerHTML = linkifyHtml(el.innerHTML, binding.value)
  },
  updated (el, binding) {
    el.innerHTML = linkifyHtml(el.innerHTML, binding.value)
  }
}

export default ({ app }) => {
  app.use(Vuelidate)
  app.directive('linkified', linkified)
}
