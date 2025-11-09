import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { favoritesApi, cleanApi } from '../utils/tauri-api'

export const useFavoritesStore = defineStore('favorites', () => {
  // 状态
  const favorites = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const selectedFavorites = ref(new Set())
  const originalCounts = ref(new Map())

  // 计算属性
  const hasSelection = computed(() => selectedFavorites.value.size > 0)
  const selectedCount = computed(() => selectedFavorites.value.size)

  // 方法
  async function loadFavorites() {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await favoritesApi.get()
      favorites.value = result || []
    } catch (err) {
      console.error('加载收藏夹失败:', err)
      error.value = err.message || '加载收藏夹失败'
      favorites.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadFavoriteDetails(favoriteId) {
    try {
      const result = await favoritesApi.getDetails(favoriteId)
      return result
    } catch (err) {
      console.error('加载收藏夹详情失败:', err)
      throw err
    }
  }

  function toggleFavorite(favoriteId) {
    if (selectedFavorites.value.has(favoriteId)) {
      selectedFavorites.value.delete(favoriteId)
    } else {
      selectedFavorites.value.add(favoriteId)
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

  function recordOriginalCount(favoriteId, count) {
    originalCounts.value.set(favoriteId, count)
  }

  function getOriginalCount(favoriteId) {
    return originalCounts.value.get(favoriteId) || 0
  }

  async function cleanFavorite(mediaId) {
    try {
      const result = await cleanApi.clean(mediaId)
      return result
    } catch (err) {
      console.error('清理收藏夹失败:', err)
      throw err
    }
  }

  async function cleanMultipleFavorites(mediaIds) {
    try {
      const result = await cleanApi.cleanMultiple(mediaIds)
      return result
    } catch (err) {
      console.error('批量清理收藏夹失败:', err)
      throw err
    }
  }

  function clearError() {
    error.value = null
  }

  function resetSelection() {
    selectedFavorites.value.clear()
  }

  return {
    // 状态
    favorites,
    isLoading,
    error,
    selectedFavorites,
    originalCounts,
    
    // 计算属性
    hasSelection,
    selectedCount,
    
    // 方法
    loadFavorites,
    loadFavoriteDetails,
    toggleFavorite,
    selectAll,
    deselectAll,
    recordOriginalCount,
    getOriginalCount,
    cleanFavorite,
    cleanMultipleFavorites,
    clearError,
    resetSelection
  }
})