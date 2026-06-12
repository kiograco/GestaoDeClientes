// https://github.com/michael-ciniawsky/postcss-load-config

const postcss = require('postcss')

const removeLegacyBrowserCss = postcss.plugin('remove-legacy-browser-css', () => root => {
  root.walkAtRules(rule => {
    const params = rule.params || ''
    if (
      (rule.name === 'media' && params.includes('-ms-high-contrast')) ||
      (rule.name === 'supports' && params.includes('-ms-ime-align')) ||
      (rule.name === 'keyframes' && rule.params === 'q-ie-spinner')
    ) {
      rule.remove()
    }
  })

  root.walkDecls(decl => {
    if (
      /^-(ms|moz|o)-/.test(decl.prop) ||
      /^(-webkit|-khtml)?-?user-drag$/.test(decl.prop) ||
      /^(-webkit-)?font-smoothing$/.test(decl.prop)
    ) {
      decl.remove()
    }
  })

  root.walkRules(rule => {
    if (/:(:)?-(moz|ms)-/.test(rule.selector)) {
      rule.remove()
    }
  })
})

module.exports = {
  plugins: [
    // to edit target browsers: use "browserslist" field in package.json
    require('autoprefixer'),
    removeLegacyBrowserCss
  ]
}
