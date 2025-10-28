<template>
  <a-space direction="vertical" size="large" style="width: 100%;">
    <!-- 收藏夹列表 -->
    <a-card title="收藏夹列表" :bordered="false">
      <div class="favorites-container">
        <a-spin v-if="favoritesStore.isLoading" size="large">
          <template #indicator>
            <a-spin size="large" />
          </template>
          <a-empty description="正在获取收藏夹列表...">
            <template #image>
              <a-spin size="large" />
            </template>
          </a-empty>
        </a-spin>

        <a-result
          v-else-if="favoritesStore.error"
          status="error"
          :title="'获取收藏夹失败'"
          :sub-title="favoritesStore.error"
        >
          <template #extra>
            <a-button type="primary" @click="loadFavorites">重试</a-button>
          </template>
        </a-result>

        <a-empty v-else-if="favoritesStore.favorites.length === 0" description="暂无收藏夹">
          <a-button type="primary" @click="loadFavorites">重新加载</a-button>
        </a-empty>

        <a-row v-else :gutter="[16, 16]">
          <a-col
            v-for="favorite in favoritesStore.favorites"
            :key="favorite.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            :xl="6"
          >
            <a-card
              hoverable
              :class="{ 'selected-card': favoritesStore.selectedFavorites.has(favorite.id) }"
              @click="favoritesStore.toggleFavorite(favorite.id)"
            >
              <template #title>
                <a-space>
                  <a-checkbox
                    :checked="favoritesStore.selectedFavorites.has(favorite.id)"
                    @click.stop
                    @change="favoritesStore.toggleFavorite(favorite.id)"
                  />
                  <a-tag color="blue">#{{ favorite.id }}</a-tag>
                </a-space>
              </template>

              <a-card-meta>
                <template #description>
                  <a-space direction="vertical" size="small" style="width: 100%;">
                    <div class="favorite-name">{{ favorite.title }}</div>
                    <a-space>
                      <VideoCameraOutlined />
                      <span>{{ favorite.media_count || 0 }} 个视频</span>
                    </a-space>
                  </a-space>
                </template>
              </a-card-meta>

              <template #actions>
                <a-tag :color="getStatusColor(getFavoriteStatus(favorite.id))">
                  {{ getFavoriteStatus(favorite.id) }}
                </a-tag>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-card>

    <!-- 批量操作 -->
    <a-card title="批量操作" :bordered="false">
      <a-space direction="vertical" size="middle" style="width: 100%;">
        <a-space wrap>
          <a-button @click="selectAll">
            <template #icon><CheckSquareOutlined /></template>
            全选
          </a-button>
          <a-button @click="deselectAll">
            <template #icon><BorderOutlined /></template>
            取消全选
          </a-button>
          <a-button
            type="primary"
            danger
            @click="cleanSelected"
            :disabled="!favoritesStore.hasSelection"
          >
            <template #icon><DeleteOutlined /></template>
            清理选中的收藏夹 ({{ favoritesStore.selectedCount }})
          </a-button>
          <a-button
            danger
            @click="cleanAll"
            :disabled="favoritesStore.favorites.length === 0"
          >
            <template #icon><ClearOutlined /></template>
            清理所有收藏夹
          </a-button>
        </a-space>

        <div v-if="isCleaning">
          <a-progress
            :percent="progressPercentage"
            :status="isCleaning ? 'active' : 'success'"
          />
          <div style="text-align: center; margin-top: 8px;">
            <a-typography-text type="secondary">{{ progressText }}</a-typography-text>
          </div>
        </div>
      </a-space>
    </a-card>
  </a-space>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFavoritesStore } from '../stores/favorites'
import { useConfigStore } from '../stores/config'
import { useNotification } from '../utils/notification'
import {
  VideoCameraOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  DeleteOutlined,
  ClearOutlined
} from '@ant-design/icons-vue'

const favoritesStore = useFavoritesStore()
const configStore = useConfigStore()
const notification = useNotification()

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
    notification.error('请先配置Cookie')
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
    notification.error('加载收藏夹失败: ' + error.message)
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
    notification.warning('请先选择要清理的收藏夹')
    return
  }
  
  const selectedIds = Array.from(favoritesStore.selectedFavorites)
  await cleanFavorites(selectedIds)
}

async function cleanAll() {
  if (favoritesStore.favorites.length === 0) {
    notification.warning('没有可清理的收藏夹')
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
    notification.success(`清理完成！成功清理 ${successCount} 个收藏夹，共清理 ${totalCleaned} 个失效视频`)
    
    // 重新加载收藏夹列表以获取最新数量
    setTimeout(() => {
      loadFavorites()
    }, 2000)
    
  } catch (error) {
    notification.error('清理失败: ' + error.message)
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

function getStatusColor(status) {
  switch (status) {
    case '待处理':
      return 'default'
    case '清理中...':
      return 'processing'
    case status.includes('已清理'):
      return 'success'
    case status.includes('清理失败'):
      return 'error'
    default:
      return 'default'
  }
}

// 组件挂载时加载收藏夹
onMounted(() => {
  if (configStore.isConfigured) {
    loadFavorites()
  }
})
</script>

<style scoped>
.favorites-container {
  min-height: 200px;
}

.selected-card {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}

.favorite-name {
  font-weight: 600;
  color: #262626;
  font-size: 16px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44.8px;
}
</style>