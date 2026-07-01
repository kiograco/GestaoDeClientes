/* eslint-env node */
const { configure } = require('quasar/wrappers')
require('dotenv').config()

module.exports = configure(function (/* ctx */) {
  return {
    boot: [
      'vuelidate',
      'apex',
      'ccComponents'
    ],

    css: [
      'app.sass'
    ],

    extras: [
      'mdi-v5',
      'roboto-font',
      'material-icons'
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20'
      },

      vueRouterMode: 'hash',

      env: {
        VUE_URL_API: process.env.VUE_URL_API,
        VUE_FACEBOOK_APP_ID: process.env.VUE_FACEBOOK_APP_ID
      },

      extendWebpack (cfg) {
        cfg.resolve = cfg.resolve || {}
        cfg.resolve.alias = Object.assign({}, cfg.resolve.alias, {
          'socket.io-client': require('path').resolve(
            __dirname,
            'node_modules/socket.io-client/build/cjs/index.js'
          )
        })
      }
    },

    devServer: {
      open: true
    },

    framework: {
      config: {
        dark: false
      },

      iconSet: 'material-icons',
      lang: 'pt-BR',

      plugins: ['Notify', 'Dialog', 'LocalStorage']
    },

    animations: 'all',

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      manifest: {
        name: 'NCProgrammers CRM',
        short_name: 'NC CRM',
        description: 'Atendimento multicanal e automação de relacionamento',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#027be3',
        icons: [
          {
            src: 'ncprogrammers-mark.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    },

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      bundler: 'builder',
      builder: {
        appId: 'com.ncprogrammers.crm'
      }
    },

    bex: {
      contentScripts: [
        'my-content-script'
      ]
    }
  }
})
