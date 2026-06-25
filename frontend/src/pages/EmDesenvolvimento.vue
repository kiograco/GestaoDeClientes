<template>
  <q-page class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">{{ title }}</h1>
        <div class="app-page-subtitle">
          Este modulo esta em desenvolvimento e sera habilitado quando a funcionalidade estiver disponivel.
        </div>
      </div>
    </div>

    <q-card class="app-card">
      <q-card-section class="app-card-section">
        <div class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-icon
              name="mdi-progress-wrench"
              size="42px"
              color="primary"
            />
          </div>
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">Funcionalidade em desenvolvimento</div>
            <div class="text-body2 text-grey-7">
              O item ja esta organizado no menu para preservar a navegacao planejada do CRM.
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
export default {
  name: 'EmDesenvolvimento',
  computed: {
    title () {
      return this.$route.query.title || 'Em desenvolvimento'
    }
  }
}
</script>
