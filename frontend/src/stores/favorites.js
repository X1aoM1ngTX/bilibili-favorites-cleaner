import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../utils/api'

export const useFavoritesStore = defineStore('favorites', () => {
  // 状态
  const favorites = ref([])
  const selectedFavorites = ref(new Set())
  const isLoading = ref(false)
  const error = ref(null)
  const originalCounts = ref(new Map())

  // 计算属性
  const selectedCount = computed(() => selectedFavorites.value.size)
  
  const hasSelection = computed(() => selectedFavorites.value.size > 0)
  
  const totalCount = computed(() => favorites.value.length)
  
  const selectedList = computed(() => {
    return favorites.value.filter(fav => selectedFavorites.value.has(fav.id))
  })

  // 方法
  async function loadFavorites() {
    console.log('favoritesStore: 开始加载收藏夹')
    isLoading.value = true
    error.value = null
    
    try {
      console.log('favoritesStore: 发起API请求')
      const response = await api.get('/favorites')
      console.log('favoritesStore: API响应', response)
      favorites.value = response.data || []
      console.log('favoritesStore: 收藏夹数据', favorites.value)
      // 清空选择状态
      selectedFavorites.value.clear()
    } catch (err) {
      console.error('favoritesStore: 获取收藏夹失败:', err)
      error.value = err.message || '获取收藏夹失败'
      favorites.value = []
    } finally {
      isLoading.value = false
      console.log('favoritesStore: 加载完成，加载状态:', isLoading.value)
    }
  }

  async function cleanFavorite(mediaId) {
    try {
      const response = await api.post('/clean', { mediaId })
      return response.data
    } catch (err) {
      console.error('清理收藏夹失败:', err)
      throw new Error(err.message || '清理收藏夹失败')
    }
  }

  async function cleanMultipleFavorites(mediaIds) {
    try {
      const response = await api.post('/clean/batch', { mediaIds })
      return response.data
    } catch (err) {
      console.error('批量清理收藏夹失败:', err)
      throw new Error(err.message || '批量清理收藏夹失败')
    }
  }

  function selectFavorite(id) {
    selectedFavorites.value.add(id)
  }

  function deselectFavorite(id) {
    selectedFavorites.value.delete(id)
  }

  function toggleFavorite(id) {
    if (selectedFavorites.value.has(id)) {
      deselectFavorite(id)
    } else {
      selectFavorite(id)
    }
  }

  function selectAll() {
    favorites.value.forEach(fav => {
      selectedFavorites.value.add(fav.id)
    })
  }

  function deselectAll() {
    selectedFavorites.value.clear()
  }

  function recordOriginalCount(id, count) {
    originalCounts.value.set(id, count)
  }

  function getOriginalCount(id) {
    return originalCounts.value.get(id) || 0
  }

  function clearError() {
    error.value = null
  }

  return {
    // 状态
    favorites,
    selectedFavorites,
    isLoading,
    error,
    originalCounts,
    
    // 计算属性
    selectedCount,
    hasSelection,
    totalCount,
    selectedList,
    
    // 方法
    loadFavorites,
    cleanFavorite,
    cleanMultipleFavorites,
    selectFavorite,
    deselectFavorite,
    toggleFavorite,
    selectAll,
    deselectAll,
    recordOriginalCount,
    getOriginalCount,
    clearError
  }
})