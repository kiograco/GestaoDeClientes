const defaultLogoUrl = '/ncprogrammers-logo.svg'

export function resolveTenantLogoUrl (logoUrl) {
  if (!logoUrl) return defaultLogoUrl

  if (/^(https?:)?\/\//i.test(logoUrl) || /^(data|blob):/i.test(logoUrl)) {
    return logoUrl
  }

  const publicPathIndex = logoUrl.indexOf('/public/')
  const normalizedLogoUrl = publicPathIndex >= 0
    ? logoUrl.slice(publicPathIndex)
    : logoUrl
  const apiUrl = (process.env.VUE_URL_API || '').replace(/\/+$/, '')
  const logoPath = normalizedLogoUrl.startsWith('/') ? normalizedLogoUrl : `/${normalizedLogoUrl}`
  return `${apiUrl}${logoPath}`
}

export { defaultLogoUrl }
