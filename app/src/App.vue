<template>
  <div class="app">
    <BasicLayouts />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useConfigStore } from './stores/config'
import BasicLayouts from './layouts/BasicLayout.vue'

const configStore = useConfigStore()

onMounted(() => {
  // 应用启动时检查配置状态
  configStore.checkConfig()
})
</script>

<style>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 80px);
}
</style>