import bus from 'src/utils/eventBus'

export default ({ app }) => {
  app.config.globalProperties.$bus = bus
}
