<template>
  <a-space direction="vertical" size="large" style="width: 100%;">
    <!-- 登录 -->
    <a-card title="登录" :bordered="false">
      <a-typography-paragraph type="secondary">
        通过二维码安全登录，登录成功后自动保存配置
      </a-typography-paragraph>

      <div class="iframe-container">
        <iframe
          :src="iframeUrl"
          @load="onIframeLoad"
          @error="onIframeError"
          frameborder="0"
          allow="fullscreen"
        ></iframe>
        <div v-if="!isIframeLoaded" class="iframe-loading">
          <a-spin size="large" />
          <a-typography-text type="secondary">正在加载登录页面...</a-typography-text>
        </div>
        <div v-if="iframeError" class="iframe-error">
          <a-result
            status="error"
            title="登录页面加载失败"
            :sub-title="iframeError"
          >
            <template #extra>
              <a-button type="primary" @click="retryIframe">重试</a-button>
            </template>
          </a-result>
        </div>
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <a-button @click="refreshLogin">
          <template #icon><ReloadOutlined /></template>
          刷新登录页面
        </a-button>
      </div>

      <a-alert
        v-if="loginStatus.message"
        :message="loginStatus.message"
        :type="loginStatus.type"
        :show-icon="true"
        style="margin-top: 16px;"
      />
    </a-card>

    <!-- Cookie展示与复制 -->
    <a-card title="Cookie展示与复制" :bordered="false">
      <a-typography-paragraph type="secondary">
        展示当前登录的Cookie，支持一键复制
      </a-typography-paragraph>

      <div class="cookie-display">
        <div class="cookie-header">
          <a-typography-text strong>当前Cookie：</a-typography-text>
          <a-button
            type="primary"
            @click="copyCookie"
            :disabled="!hasCookie"
            size="small"
          >
            <template #icon><CopyOutlined /></template>
            复制Cookie
          </a-button>
        </div>
        <div class="cookie-content">
          <a-empty v-if="!hasCookie" description="请先登录获取Cookie" />
          <a-typography-paragraph v-else code class="cookie-text">
            {{ configStore.config?.cookie }}
          </a-typography-paragraph>
        </div>
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <a-button @click="refreshCookie">
          <template #icon><ReloadOutlined /></template>
          刷新Cookie
        </a-button>
      </div>

      <a-alert
        v-if="copyStatus.message"
        :message="copyStatus.message"
        :type="copyStatus.type"
        :show-icon="true"
        style="margin-top: 16px;"
      />
    </a-card>

    <!-- 手动配置 -->
    <a-card title="手动配置" :bordered="false">
      <a-typography-paragraph type="secondary">
        如果无法登录，你也可以手动配置Cookie：
      </a-typography-paragraph>

      <div style="text-align: center;">
        <a-button @click="toggleManualForm">
          {{ showManualForm ? '隐藏手动配置' : '手动配置Cookie' }}
        </a-button>

        <div v-if="showManualForm" class="manual-form">
          <a-textarea
            v-model:value="manualCookieInput"
            placeholder="请粘贴完整的Cookie字符串，包含SESSDATA、bili_jct、DedeUserID等字段"
            :rows="6"
            style="margin-bottom: 16px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;"
          />
          <a-button type="primary" @click="saveManualCookie">
            <template #icon><SaveOutlined /></template>
            保存Cookie
          </a-button>
        </div>
      </div>
    </a-card>
  </a-space>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { useNotification } from '../utils/notification'
import { ReloadOutlined, CopyOutlined, SaveOutlined } from '@ant-design/icons-vue'

const configStore = useConfigStore()
const notification = useNotification()

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
  // 在Tauri环境中，我们使用固定的URL
  const targetOrigin = 'http://localhost:1420'
  const url = `${SERVICE_URL}/?mode=iframe&targetOrigin=${encodeURIComponent(targetOrigin)}`
  console.log('登录URL:', url)
  console.log('目标Origin:', targetOrigin)
  console.log('当前页面origin:', window.location.origin)
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

async function refreshCookie() {
  try {
    showCopyStatus('正在刷新Cookie...', 'info')
    await configStore.checkConfig()
    if (hasCookie.value) {
      showCopyStatus('✅ Cookie已刷新', 'success')
    } else {
      showCopyStatus('暂无Cookie数据', 'info')
    }
  } catch (error) {
    showCopyStatus('❌ 刷新Cookie失败: ' + error.message, 'error')
  }
}

function toggleManualForm() {
  showManualForm.value = !showManualForm.value
}

async function saveManualCookie() {
  const cookieString = manualCookieInput.value.trim()
  
  if (!cookieString) {
    notification.error('请输入Cookie')
    return
  }

  try {
    const parsedCookies = parseCookieString(cookieString)
    
    if (!parsedCookies.SESSDATA || !parsedCookies.bili_jct || !parsedCookies.DedeUserID) {
      notification.error('Cookie格式不正确，缺少必要字段')
      return
    }

    const config = {
      up_mid: parsedCookies.DedeUserID,
      csrf_token: parsedCookies.bili_jct,
      cookie: cookieString
    }

    await configStore.saveConfig(config)
    notification.success('配置保存成功')
    manualCookieInput.value = ''
    showManualForm.value = false
  } catch (error) {
    notification.error('保存配置失败: ' + error.message)
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
    console.log('=== 收到postMessage事件 ===')
    console.log('事件对象:', event)
    console.log('消息来源:', event.origin)
    console.log('消息数据:', event.data)
    console.log('数据类型:', typeof event.data)
    console.log('期望来源1 (SERVICE_URL):', SERVICE_URL)
    console.log('期望来源2 (当前页面):', window.location.origin)
    
    // 临时接受所有消息进行调试
    if (event.origin !== SERVICE_URL && event.origin !== window.location.origin) {
      console.warn('收到非预期来源的消息，但为了调试继续处理:', event.origin)
      // 不要return，继续处理所有消息
    }
    
    // 尝试解析不同格式的消息
    let messageData
    if (typeof event.data === 'string') {
      try {
        messageData = JSON.parse(event.data)
        console.log('解析JSON字符串消息:', messageData)
      } catch (e) {
        console.log('消息是纯字符串，无法解析为JSON:', event.data)
        messageData = { raw: event.data }
      }
    } else {
      messageData = event.data
      console.log('消息是对象格式:', messageData)
    }
    
    const { type, mode, data, code, cookie } = messageData
    console.log('提取的消息字段:', { type, mode, data, code, cookie })

    // 支持两种登录成功格式：
    // 1. 旧格式: { type: 'success', mode: 'xxx', data: 'cookie_string' }
    // 2. 新格式: { code: 0, cookie: 'cookie_string', ... }
    let isSuccess = false
    let cookieData = null
    let loginMode = mode

    if (type === 'success' && data) {
      // 旧格式
      isSuccess = true
      cookieData = data
      loginMode = mode || '未知'
    } else if (code === 0 && cookie) {
      // 新格式
      isSuccess = true
      cookieData = cookie
      loginMode = '扫码'
    }

    if (isSuccess && cookieData) {
      showLoginStatus(`✅ ${loginMode}模式登录成功！Cookie已获取`, 'success')

      // 解析Cookie并保存配置
      const parsedCookies = parseCookieString(cookieData)
      console.log('解析的Cookie:', parsedCookies)

      const config = {
        up_mid: parsedCookies.DedeUserID,
        csrf_token: parsedCookies.bili_jct,
        cookie: cookieData
      }

      console.log('保存的配置:', config)
      
      configStore.saveConfig(config).then(() => {
        notification.success('登录成功！配置已保存')

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
      }).catch((error) => {
        console.error('保存配置失败:', error)
        notification.error('登录成功但保存配置失败: ' + error.message)
        showLoginStatus('❌ 配置保存失败，请检查网络连接', 'error')
      })
    }
  })
})
</script>

<style scoped>
.iframe-container {
  position: relative;
  width: 420px;
  height: 610px;
  max-width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  margin: 16px auto 0;
  background: #fafafa;
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
  gap: 16px;
  background: #fafafa;
  z-index: 10;
}

.iframe-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  z-index: 10;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cookie-display {
  margin: 16px 0;
}

.cookie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cookie-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  min-height: 80px;
}

.cookie-text {
  margin: 0;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.manual-form {
  margin-top: 16px;
}
</style>