import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configApi } from '../utils/tauri-api'

export const useConfigStore = defineStore('config', () => {
  // 状态
  const config = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // 计算属性
  const isConfigured = computed(() => {
    return config.value && config.value.up_mid && config.value.csrf_token && config.value.cookie
  })

  const statusText = computed(() => {
    if (isLoading.value) return '检查中...'
    if (isConfigured.value) return '已配置'
    return '未配置'
  })

  const statusClass = computed(() => {
    if (isLoading.value) return 'checking'
    if (isConfigured.value) return 'configured'
    return ''
  })

  // 方法
  async function checkConfig() {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await configApi.get()
      config.value = result
    } catch (err) {
      console.error('检查配置失败:', err)
      error.value = err.message || '检查配置失败'
      config.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(newConfig) {
    isLoading.value = true
    error.value = null
    
    try {
      await configApi.save(newConfig)
      config.value = newConfig
      return { success: true }
    } catch (err) {
      console.error('保存配置失败:', err)
      error.value = err.message || '保存配置失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteConfig() {
    isLoading.value = true
    error.value = null
    
    try {
      await configApi.delete()
      config.value = null
    } catch (err) {
      console.error('删除配置失败:', err)
      error.value = err.message || '删除配置失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // 状态
    config,
    isLoading,
    error,
    
    // 计算属性
    isConfigured,
    statusText,
    statusClass,
    
    // 方法
    checkConfig,
    saveConfig,
    deleteConfig,
    clearError
  }
})