<template>
  <div class="login-panel">
    <!-- 登录 -->
    <div class="card">
      <h2>登录</h2>
      <p>通过二维码安全登录，登录成功后自动保存配置</p>
      
      <div class="iframe-container">
        <iframe
          :src="iframeUrl"
          @load="onIframeLoad"
          @error="onIframeError"
          frameborder="0"
          allow="fullscreen"
        ></iframe>
        <div v-if="!isIframeLoaded" class="iframe-loading">
          <div class="spinner"></div>
          <p>正在加载登录页面...</p>
        </div>
        <div v-if="iframeError" class="iframe-error">
          <p>❌ 登录页面加载失败</p>
          <p class="error-details">{{ iframeError }}</p>
          <button class="btn btn-small btn-primary" @click="retryIframe">重试</button>
        </div>
      </div>
      
      <div class="button-group">
        <button class="btn btn-secondary" @click="refreshLogin">
          🔄 刷新登录页面
        </button>
      </div>
      
      <div v-if="loginStatus.message" class="status" :class="[loginStatus.type, { 'hidden': !loginStatus.message }]">
        {{ loginStatus.message }}
      </div>
    </div>

    <!-- Cookie展示与复制 -->
    <div class="card">
      <h2>Cookie展示与复制</h2>
      <p>展示当前登录的Cookie，支持一键复制</p>
      
      <div class="cookie-display">
        <div class="cookie-container">
          <div class="cookie-header">
            <span>当前Cookie：</span>
            <button 
              class="btn btn-small btn-primary" 
              @click="copyCookie"
              :disabled="!hasCookie"
            >
              📋 复制Cookie
            </button>
          </div>
          <div class="cookie-content">
            <div v-if="!hasCookie" class="cookie-placeholder">
              请先登录获取Cookie
            </div>
            <div v-else class="cookie-text">
              <pre>{{ configStore.config?.cookie }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button class="btn btn-secondary" @click="refreshCookie">
          🔄 刷新Cookie
        </button>
      </div>

      <div v-if="copyStatus.message" class="status" :class="[copyStatus.type, { 'hidden': !copyStatus.message }]">
        {{ copyStatus.message }}
      </div>
    </div>

    <!-- 手动配置 -->
    <div class="card">
      <h2>手动配置</h2>
      <div class="manual-config">
        <p style="margin-bottom: 8px;">如果无法登录，你也可以手动配置Cookie：</p>
        <button class="btn btn-secondary" @click="toggleManualForm">
          {{ showManualForm ? '隐藏手动配置' : '手动配置Cookie' }}
        </button>
        <div v-if="showManualForm" class="manual-form">
          <textarea
            v-model="manualCookieInput"
            placeholder="请粘贴完整的Cookie字符串，包含SESSDATA、bili_jct、DedeUserID等字段"
            rows="6"
            class="textarea"
          ></textarea>
          <button class="btn btn-primary" @click="saveManualCookie">保存Cookie</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { useToastStore } from '../stores/toast'

const configStore = useConfigStore()
const toast = useToastStore()

// 状态
const isIframeLoaded = ref(false)
const iframeError = ref('')
const showManualForm = ref(false)
const manualCookieInput = ref('')
const loginStatus = ref({ message: '', type: 'info' })
const copyStatus = ref({ message: '', type: 'info' })

// 配置
const SERVICE_URL = 'https://login.bilibili.bi'

// 计算属性
const iframeUrl = computed(() => {
  // 优先使用专门的后端URL环境变量，如果没有则从API基础URL推导
  const backendUrl = process.env.VUE_APP_BACKEND_URL
  const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api'
  
  let targetOrigin
  if (backendUrl) {
    targetOrigin = backendUrl
  } else {
    targetOrigin = apiBaseUrl.replace('/api', '')
  }
  
  const url = `${SERVICE_URL}/?mode=iframe&targetOrigin=${encodeURIComponent(targetOrigin)}`
  console.log('登录URL:', url)
  console.log('API基础URL:', apiBaseUrl)
  console.log('后端URL:', backendUrl)
  console.log('目标Origin:', targetOrigin)
  return url
})

const hasCookie = computed(() => {
  return configStore.config && configStore.config.cookie
})

// 方法
function refreshLogin() {
  isIframeLoaded.value = false
  iframeError.value = ''
  showLoginStatus('正在刷新登录页面...', 'info')
  
  // 强制重新加载iframe
  const iframe = document.querySelector('.iframe-container iframe')
  if (iframe) {
    const currentSrc = iframe.src
    iframe.src = ''
    setTimeout(() => {
      iframe.src = currentSrc
    }, 100)
  }
}

function onIframeLoad() {
  // iframe加载完成
  isIframeLoaded.value = true
  iframeError.value = ''
  console.log('iframe加载完成')
  
  // 检查iframe是否正确加载
  const iframe = document.querySelector('.iframe-container iframe')
  if (iframe) {
    try {
      // 尝试访问iframe内容（可能会因为跨域策略失败）
      console.log('iframe src:', iframe.src)
    } catch (error) {
      console.warn('无法访问iframe内容，可能是跨域限制:', error)
    }
  }
}

function onIframeError(event) {
  console.error('iframe加载错误:', event)
  iframeError.value = '无法连接到登录服务器，请检查网络连接或稍后重试'
  isIframeLoaded.value = false
}

function retryIframe() {
  refreshLogin()
}

function showLoginStatus(message, type = 'info') {
  loginStatus.value = { message, type }
  if (type === 'info') {
    setTimeout(() => hideLoginStatus(), 3000)
  }
}

function hideLoginStatus() {
  loginStatus.value = { message: '', type: 'info' }
}

function showCopyStatus(message, type = 'info') {
  copyStatus.value = { message, type }
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      copyStatus.value = { message: '', type: 'info' }
    }, 3000)
  }
}

async function copyCookie() {
  if (!hasCookie.value) {
    showCopyStatus('没有可复制的Cookie', 'error')
    return
  }

  try {
    await navigator.clipboard.writeText(configStore.config.cookie)
    showCopyStatus('✅ Cookie已复制到剪贴板', 'success')
  } catch (error) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = configStore.config.cookie
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
      showCopyStatus('✅ Cookie已复制到剪贴板', 'success')
    } catch (error) {
      showCopyStatus('❌ 复制失败，请手动复制', 'error')
    }
    
    document.body.removeChild(textArea)
  }
}

function refreshCookie() {
  configStore.checkConfig()
}

function toggleManualForm() {
  showManualForm.value = !showManualForm.value
}

async function saveManualCookie() {
  const cookieString = manualCookieInput.value.trim()
  
  if (!cookieString) {
    toast.error('请输入Cookie')
    return
  }

  try {
    const parsedCookies = parseCookieString(cookieString)
    
    if (!parsedCookies.SESSDATA || !parsedCookies.bili_jct || !parsedCookies.DedeUserID) {
      toast.error('Cookie格式不正确，缺少必要字段')
      return
    }

    const config = {
      up_mid: parsedCookies.DedeUserID,
      csrf_token: parsedCookies.bili_jct,
      cookie: cookieString
    }

    await configStore.saveConfig(config)
    toast.success('配置保存成功')
    manualCookieInput.value = ''
    showManualForm.value = false
  } catch (error) {
    toast.error('保存配置失败: ' + error.message)
  }
}

function parseCookieString(cookieString) {
  const cookies = {}
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = value
    }
  })
  return cookies
}

// 初始化
onMounted(() => {
  // 显示登录提示
  showLoginStatus('请使用哔哩哔哩APP扫描下方二维码登录', 'info')
  
  // 检查并显示当前配置的Cookie
  refreshCookie()
  
  // 监听登录消息
  window.addEventListener('message', (event) => {
    // 验证消息来源
    if (event.origin !== SERVICE_URL) {
      console.warn('收到非预期来源的消息:', event.origin)
      return
    }
    
    const { type, mode, data } = event.data
    if (type === 'success') {
      showLoginStatus(`✅ ${mode}模式登录成功！Cookie已获取`, 'success')
      
      // 解析Cookie并保存配置
      const parsedCookies = parseCookieString(data)
      const config = {
        up_mid: parsedCookies.DedeUserID,
        csrf_token: parsedCookies.bili_jct,
        cookie: data
      }
      
      configStore.saveConfig(config).then(() => {
        toast.success('登录成功！配置已保存')
        
        // 登录成功后显示状态信息
        setTimeout(() => {
          hideLoginStatus()
          // 切换到清理面板
          const homeComponent = document.querySelector('.home')
          if (homeComponent && homeComponent.__vue_app__) {
            // 尝试通过父组件切换选项卡
            const event = new CustomEvent('switch-tab', { detail: 'clean' })
            window.dispatchEvent(event)
          }
        }, 2000)
      })
    }
  })
})
</script>

<style scoped>
.login-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.iframe-container {
  position: relative;
  width: 420px;
  height: 610px;
  max-width: 100%;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem auto 0;
  background: #f8f9fa;
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  z-index: 10;
}

.iframe-loading .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.iframe-loading p {
  color: #6c757d;
  font-size: 0.9rem;
}

.iframe-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fef2f2;
  z-index: 10;
  padding: 20px;
  text-align: center;
}

.iframe-error p {
  margin-bottom: 10px;
  color: #721c24;
}

.iframe-error .error-details {
  font-size: 0.8rem;
  color: #856404;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.manual-form {
  margin-top: 20px;
  text-align: left;
}

.textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8125rem;
  resize: vertical;
  transition: border-color 0.3s ease;
  margin-bottom: 15px;
}

.textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.manual-config {
  text-align: center;
}
</style>