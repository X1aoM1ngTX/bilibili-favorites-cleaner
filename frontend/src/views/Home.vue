<template>
  <div class="home">
    <!-- 配置状态显示 -->
    <ConfigStatus />

    <!-- 选项卡导航 -->
    <nav class="tab-nav">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'login' }"
        @click="activeTab = 'login'"
      >
        登录配置
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'clean' }"
        @click="activeTab = 'clean'"
      >
        清理收藏夹
      </button>
    </nav>

    <!-- 登录配置面板 -->
    <div v-show="activeTab === 'login'" class="tab-panel active">
      <LoginPanel />
    </div>

    <!-- 清理收藏夹面板 -->
    <div v-show="activeTab === 'clean'" class="tab-panel active">
      <CleanPanel />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import ConfigStatus from '../components/ConfigStatus.vue'
import LoginPanel from '../components/LoginPanel.vue'
import CleanPanel from '../components/CleanPanel.vue'
import { useConfigStore } from '../stores/config'
import { useFavoritesStore } from '../stores/favorites'

const activeTab = ref('login')
const configStore = useConfigStore()
const favoritesStore = useFavoritesStore()

// 监听选项卡切换
watch(activeTab, async (newTab) => {
  if (newTab === 'clean' && configStore.isConfigured) {
    // 切换到清理面板且已配置时，加载收藏夹
    await favoritesStore.loadFavorites()
  }
})

// 监听登录成功事件
onMounted(() => {
  window.addEventListener('switch-tab', (event) => {
    activeTab.value = event.detail
  })
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>