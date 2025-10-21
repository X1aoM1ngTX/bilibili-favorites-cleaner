<template>
  <div class="clean-panel">
    <!-- 收藏夹列表 -->
    <div class="card">
      <h2>收藏夹列表</h2>
      <div class="favorites-container">
        <div v-if="favoritesStore.isLoading" class="loading">
          <div class="spinner large"></div>
          <p>正在获取收藏夹列表...</p>
        </div>
        <div v-else-if="favoritesStore.error" class="error-message">
          <p>获取收藏夹失败: {{ favoritesStore.error }}</p>
          <button class="btn btn-primary" @click="loadFavorites">重试</button>
        </div>
        <div v-else-if="favoritesStore.favorites.length === 0" class="empty-message">
          <p>暂无收藏夹</p>
        </div>
        <div v-else class="favorites-grid">
          <div
            v-for="favorite in favoritesStore.favorites"
            :key="favorite.id"
            class="favorite-card"
            :class="{ selected: favoritesStore.selectedFavorites.has(favorite.id) }"
          >
            <div class="card-header">
              <input
                type="checkbox"
                class="favorite-checkbox"
                :checked="favoritesStore.selectedFavorites.has(favorite.id)"
                @change="favoritesStore.toggleFavorite(favorite.id)"
              >
              <div class="favorite-id">#{{ favorite.id }}</div>
            </div>
            <div class="card-body">
              <div class="favorite-name">{{ favorite.title }}</div>
              <div class="favorite-meta">
                <div class="meta-item">
                  <span class="meta-icon">📹</span>
                  <span>{{ favorite.media_count || 0 }} 个视频</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <div class="favorite-status" :data-id="favorite.id">
                {{ getFavoriteStatus(favorite.id) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <div class="card">
      <h2>批量操作</h2>
      <div class="batch-operations">
        <button class="btn btn-primary" @click="selectAll">全选</button>
        <button class="btn btn-secondary" @click="deselectAll">取消全选</button>
        <button 
          class="btn btn-danger" 
          @click="cleanSelected"
          :disabled="!favoritesStore.hasSelection"
        >
          清理选中的收藏夹 ({{ favoritesStore.selectedCount }})
        </button>
        <button 
          class="btn btn-warning" 
          @click="cleanAll"
          :disabled="favoritesStore.favorites.length === 0"
        >
          清理所有收藏夹
        </button>
      </div>
      
      <div v-if="isCleaning" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <div class="progress-text">{{ progressText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFavoritesStore } from '../stores/favorites'
import { useConfigStore } from '../stores/config'
import { useToastStore } from '../stores/toast'

const favoritesStore = useFavoritesStore()
const configStore = useConfigStore()
const toast = useToastStore()

// 状态
const isCleaning = ref(false)
const currentProgress = ref(0)
const totalProgress = ref(0)
const progressText = ref('准备开始...')

// 计算属性
const progressPercentage = computed(() => {
  return totalProgress.value > 0 ? (currentProgress.value / totalProgress.value) * 100 : 0
})

// 方法
async function loadFavorites() {
  console.log('开始加载收藏夹...')
  console.log('配置状态:', configStore.isConfigured)
  console.log('配置信息:', configStore.config)
  
  if (!configStore.isConfigured) {
    toast.error('请先配置Cookie')
    return
  }
  
  try {
    await favoritesStore.loadFavorites()
    console.log('收藏夹加载完成:', favoritesStore.favorites)
    
    // 记录原始数量
    favoritesStore.favorites.forEach(fav => {
      favoritesStore.recordOriginalCount(fav.id, fav.media_count || 0)
    })
  } catch (error) {
    console.error('加载收藏夹失败:', error)
    toast.error('加载收藏夹失败: ' + error.message)
  }
}

function selectAll() {
  favoritesStore.selectAll()
}

function deselectAll() {
  favoritesStore.deselectAll()
}

async function cleanSelected() {
  if (!favoritesStore.hasSelection) {
    toast.warning('请先选择要清理的收藏夹')
    return
  }
  
  const selectedIds = Array.from(favoritesStore.selectedFavorites)
  await cleanFavorites(selectedIds)
}

async function cleanAll() {
  if (favoritesStore.favorites.length === 0) {
    toast.warning('没有可清理的收藏夹')
    return
  }
  
  const allIds = favoritesStore.favorites.map(fav => fav.id)
  await cleanFavorites(allIds)
}

async function cleanFavorites(mediaIds) {
  isCleaning.value = true
  currentProgress.value = 0
  totalProgress.value = mediaIds.length
  
  try {
    // 更新状态为清理中
    mediaIds.forEach(id => {
      updateFavoriteStatus(id, '清理中...')
    })
    
    const results = await favoritesStore.cleanMultipleFavorites(mediaIds)
    
    // 处理结果
    let successCount = 0
    let totalCleaned = 0
    
    results.results.forEach((result, index) => {
      currentProgress.value = index + 1
      progressText.value = `正在清理收藏夹 ${index + 1}/${mediaIds.length}...`
      
      if (result.success) {
        successCount++
        totalCleaned += result.cleanedCount
        updateFavoriteStatus(result.mediaId, `已清理 ${result.cleanedCount} 个失效视频`)
      } else {
        updateFavoriteStatus(result.mediaId, `清理失败: ${result.error}`)
      }
    })
    
    // 显示最终结果
    progressText.value = `清理完成！成功清理 ${successCount} 个收藏夹，共清理 ${totalCleaned} 个失效视频`
    toast.success(`清理完成！成功清理 ${successCount} 个收藏夹，共清理 ${totalCleaned} 个失效视频`)
    
    // 重新加载收藏夹列表以获取最新数量
    setTimeout(() => {
      loadFavorites()
    }, 2000)
    
  } catch (error) {
    toast.error('清理失败: ' + error.message)
    progressText.value = '清理失败'
  } finally {
    isCleaning.value = false
  }
}

function updateFavoriteStatus(id, status) {
  const statusElement = document.querySelector(`.favorite-status[data-id="${id}"]`)
  if (statusElement) {
    statusElement.textContent = status
  }
}

function getFavoriteStatus(id) {
  // 这里可以根据需要返回不同的状态
  return '待处理'
}

// 组件挂载时加载收藏夹
onMounted(() => {
  if (configStore.isConfigured) {
    loadFavorites()
  }
})
</script>

<style scoped>
.clean-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.favorites-container {
  min-height: 200px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.error-message, .empty-message {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.error-message {
  color: #e74c3c;
}

/* 卡片网格布局 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.favorite-card {
  background: #fff;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.favorite-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.favorite-card.selected {
  background: #e8f4fd;
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.favorite-card.selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.favorite-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.favorite-id {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 600;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorite-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.8rem;
}

.favorite-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 0.9rem;
}

.meta-icon {
  font-size: 1rem;
}

.card-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f1f3f4;
}

.favorite-status {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.batch-operations {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.progress-container {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
  }
  
  .batch-operations {
    flex-direction: column;
  }
  
  .favorite-card {
    padding: 15px;
  }
  
  .favorite-name {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>