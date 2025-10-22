import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  // 状态
  const visible = ref(false)
  const message = ref('')
  const type = ref('info')
  let timeoutId = null

  // 方法
  function showToast(msg, toastType = 'info', duration = 3000) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    message.value = msg
    type.value = toastType
    visible.value = true

    // 自动隐藏
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        hideToast()
      }, duration)
    }
  }

  function hideToast() {
    visible.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function success(msg, duration) {
    showToast(msg, 'success', duration)
  }

  function error(msg, duration) {
    showToast(msg, 'error', duration)
  }

  function warning(msg, duration) {
    showToast(msg, 'warning', duration)
  }

  function info(msg, duration) {
    showToast(msg, 'info', duration)
  }

  return {
    // 状态
    visible: visible,
    message: message,
    type: type,
    
    // 计算属性（用于模板）
    get toast() {
      return {
        visible: visible.value,
        message: message.value,
        type: type.value
      }
    },
    
    // 方法
    showToast,
    hideToast,
    success,
    error,
    warning,
    info
  }
})