<template>
  <q-dialog v-model="dialogVisible">
    <q-card style="min-width: 70vw">
      <q-card-section>
        <Codemirror
          v-model="flowJsonData"
          :extensions="extensions"
          :style="{ height: '400px' }"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Fechar" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'

export default {
  name: 'InfoDialog',
  props: {
    data: Object
  },
  components: { Codemirror },
  data () {
    return {
      dialogVisible: false,
      flowJsonData: '',
      extensions: [json(), oneDark]
    }
  },
  methods: {
    init () {
      this.dialogVisible = true
      this.flowJsonData = JSON.stringify(this.data, null, 4)
    }
  }
}
</script>
