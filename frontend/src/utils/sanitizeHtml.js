const ALLOWED_TAGS = ['B', 'STRONG', 'I', 'EM', 'S', 'BR', 'P', 'UL', 'OL', 'LI', 'A']
const ALLOWED_ATTRS = {
  A: ['href', 'target', 'rel'],
  P: ['class']
}

const isSafeUrl = value => {
  try {
    const parsed = new URL(value, window.location.origin)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch (err) {
    return false
  }
}

export const escapeHtml = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export const sanitizeHtml = value => {
  if (!value) return ''

  const template = document.createElement('template')
  template.innerHTML = String(value)

  const walk = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName
        if (!ALLOWED_TAGS.includes(tag)) {
          child.replaceWith(document.createTextNode(child.textContent || ''))
          return
        }

        Array.from(child.attributes).forEach(attr => {
          const name = attr.name.toLowerCase()
          const allowed = ALLOWED_ATTRS[tag] || []
          if (name.startsWith('on') || !allowed.includes(name)) {
            child.removeAttribute(attr.name)
            return
          }
          if (name === 'href' && !isSafeUrl(attr.value)) {
            child.removeAttribute(attr.name)
          }
        })

        if (tag === 'A') {
          child.setAttribute('rel', 'noopener noreferrer')
        }

        walk(child)
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove()
      }
    })
  }

  walk(template.content)
  return template.innerHTML
}
