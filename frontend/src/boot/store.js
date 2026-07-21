import createStore from 'src/store'

export default ({ app, router }) => {
  const store = createStore()
  store.$router = router
  app.use(store)
}
