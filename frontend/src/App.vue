<template>
  <div class="app">
    <Header />
    <main class="main">
      <router-view />
    </main>
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Header from './components/Header.vue'
import Toast from './components/Toast.vue'
import { useConfigStore } from './stores/config'

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
