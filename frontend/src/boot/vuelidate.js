import Vuelidate from '@vuelidate/core'
import linkify from 'vue-linkify'

export default ({ app }) => {
  app.use(Vuelidate)
  app.directive('linkified', linkify)
}
