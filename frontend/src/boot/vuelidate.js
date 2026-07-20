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
  app.directive('linkified', linkified)
}
