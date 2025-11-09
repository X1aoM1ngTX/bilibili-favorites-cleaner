<template>
  <div class="sort-panel">
    <a-card title="收藏夹排序" :bordered="false">
      <template #extra>
        <a-space>
          <a-button @click="resetOrder" :disabled="loading">
            <ReloadOutlined /> 重置顺序
          </a-button>
          <a-button
            type="primary"
            @click="saveSort"
            :loading="saving"
            :disabled="loading || !hasChanges"
          >
            <SaveOutlined /> 保存排序
          </a-button>
        </a-space>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
        <p>正在加载收藏夹列表...</p>
      </div>

      <!-- 错误状态 -->
      <a-alert
        v-else-if="error"
        :message="error"
        type="error"
        show-icon
        style="margin-bottom: 16px"
      />

      <!-- 收藏夹列表 -->
      <div v-else-if="sortedFolders.length > 0" class="folders-container">
        <a-alert
          message="拖拽收藏夹可以调整顺序"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-alert
          message="默认收藏夹无法进行排序操作"
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />

        <draggable
          v-model="sortedFolders"
          tag="div"
          :animation="200"
          handle=".drag-handle:not(.disabled-handle)"
          ghost-class="ghost"
          chosen-class="chosen"
          :disabled="false"
          @start="dragStart"
          @end="dragEnd"
        >
          <template #item="{ element: folder, index }">
            <div
              class="folder-item"
              :class="{
                'is-dragging': draggingIndex === index,
                'is-disabled': isDefaultFolder(folder)
              }"
            >
              <div class="folder-content">
                <div
                  class="drag-handle"
                  :class="{ 'disabled-handle': isDefaultFolder(folder) }"
                >
                  <MenuOutlined />
                </div>
                <div class="folder-info">
                  <div class="folder-title">
                    {{ folder.title }}
                    <a-tag v-if="isDefaultFolder(folder)" color="orange" size="small" style="margin-left: 8px;">默认收藏夹</a-tag>
                  </div>
                  <div class="folder-meta">
                    <span class="folder-count">{{ folder.media_count }} 个视频</span>
                    <span class="folder-id">ID: {{ folder.id }}</span>
                  </div>
                </div>
                <div class="folder-actions">
                  <a-button
                    type="text"
                    size="small"
                    @click="moveUp(index)"
                    :disabled="index === 0 || isDefaultFolder(folder)"
                  >
                    <ArrowUpOutlined />
                  </a-button>
                  <a-button
                    type="text"
                    size="small"
                    @click="moveDown(index)"
                    :disabled="index === sortedFolders.length - 1 || isDefaultFolder(folder)"
                  >
                    <ArrowDownOutlined />
                  </a-button>
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <!-- 排序统计 -->
        <div class="sort-stats">
          <a-descriptions size="small" :column="2">
            <a-descriptions-item label="收藏夹总数">
              {{ sortedFolders.length }}
            </a-descriptions-item>
            <a-descriptions-item label="总视频数">
              {{ totalVideos }}
            </a-descriptions-item>
            <a-descriptions-item label="当前顺序变化">
              <span :class="{ 'text-success': hasChanges }">
                {{ hasChanges ? '是' : '否' }}
              </span>
            </a-descriptions-item>
            <a-descriptions-item label="拖拽状态">
              <span :class="{ 'text-warning': dragging }">
                {{ dragging ? '拖拽中' : '就绪' }}
              </span>
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>

      <!-- 空状态 -->
      <a-empty
        v-else
        description="暂无收藏夹"
      />

      <!-- 排序结果对话框 -->
      <a-modal
        v-model:open="showResultModal"
        title="排序结果"
        :footer="null"
        width="600px"
      >
        <div v-if="sortResult">
          <a-result
            :status="sortResult.success ? 'success' : 'error'"
            :title="sortResult.success ? '排序成功' : '排序失败'"
            :sub-title="sortResult.message"
          >
            <template #extra>
              <!-- 成功状态 -->
              <div v-if="sortResult.success">
                <a-button type="primary" @click="refreshFolders">
                  <ReloadOutlined /> 刷新列表
                </a-button>
              </div>

              <!-- CSRF错误处理帮助 -->
              <div v-else-if="sortResult.isCsrfError" class="csrf-help">
                <a-alert
                  message="CSRF Token 错误解决方案"
                  description="请按以下步骤重新配置Cookie信息："
                  type="info"
                  show-icon
                  style="margin-bottom: 16px; text-align: left;"
                >
                  <template #action>
                    <a-button size="small" type="primary" @click="$router.push('/config')">
                      前往配置页面
                    </a-button>
                  </template>
                </a-alert>

                <div style="text-align: left; font-size: 14px; color: #666;">
                  <p>1. 在浏览器中登录B站</p>
                  <p>2. 按F12打开开发者工具</p>
                  <p>3. 在Network标签页找到任意B站请求</p>
                  <p>4. 复制完整的Cookie字符串（包含bili_jct字段）</p>
                  <p>5. 在配置页面重新保存Cookie信息</p>
                </div>

                <div style="margin-top: 16px;">
                  <a-button @click="refreshFolders">
                    <ReloadOutlined /> 重试
                  </a-button>
                  <a-button type="primary" style="margin-left: 8px;" @click="$router.push('/config')">
                    重新配置Cookie
                  </a-button>
                </div>
              </div>

              <!-- 普通错误处理 -->
              <div v-else>
                <a-button @click="refreshFolders">
                  <ReloadOutlined /> 重试
                </a-button>
              </div>
            </template>
          </a-result>
        </div>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import draggable from 'vuedraggable'
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import { useConfigStore } from '../stores/config'
import { sortApi } from '../utils/tauri-api'

const configStore = useConfigStore()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const folders = ref([])
const sortedFolders = ref([])
const dragging = ref(false)
const draggingIndex = ref(-1)
const showResultModal = ref(false)
const sortResult = ref(null)

// 计算属性
const hasChanges = computed(() => {
  if (folders.value.length !== sortedFolders.value.length) {
    return true
  }
  return folders.value.some((folder, index) => {
    return folder.id !== sortedFolders.value[index]?.id
  })
})

// 检查是否为CSRF相关错误
const isCsrfError = (errorMessage) => {
  return errorMessage && (
    errorMessage.includes('csrf') ||
    errorMessage.includes('bili_jct') ||
    errorMessage.includes('CSRF') ||
    errorMessage.includes('token未找到')
  )
}

const totalVideos = computed(() => {
  return folders.value.reduce((sum, folder) => sum + folder.media_count, 0)
})

// 判断是否为默认收藏夹
const isDefaultFolder = (folder) => {
  return folder.title === '默认收藏夹' || folder.title.includes('默认') || folder.attr === 0
}

// 方法
const loadFolders = async () => {
  if (!configStore.isConfigured) {
    error.value = '请先配置Cookie'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await sortApi.getFolders()

    // Tauri API直接返回收藏夹数组
    if (Array.isArray(result)) {
      folders.value = [...result]
      sortedFolders.value = [...result]
    } else {
      error.value = '获取收藏夹列表失败：返回数据格式不正确'
    }
  } catch (err) {
    console.error('获取收藏夹列表失败:', err)
    error.value = '网络错误，请检查后端服务是否正常运行'
  } finally {
    loading.value = false
  }
}

const resetOrder = () => {
  sortedFolders.value = [...folders.value]
  message.info('已重置为原始顺序')
}

const moveUp = (index) => {
  if (index > 0) {
    const item = sortedFolders.value[index]
    if (!isDefaultFolder(item)) {
      sortedFolders.value.splice(index, 1)
      sortedFolders.value.splice(index - 1, 0, item)
    }
  }
}

const moveDown = (index) => {
  if (index < sortedFolders.value.length - 1) {
    const item = sortedFolders.value[index]
    if (!isDefaultFolder(item)) {
      sortedFolders.value.splice(index, 1)
      sortedFolders.value.splice(index + 1, 0, item)
    }
  }
}

const dragStart = (evt) => {
  dragging.value = true
  draggingIndex.value = evt.oldIndex

  // 禁用文本选择
  document.body.style.userSelect = 'none'
  document.body.style.webkitUserSelect = 'none'
  document.body.style.mozUserSelect = 'none'
  document.body.style.msUserSelect = 'none'
}

const dragEnd = (evt) => {
  dragging.value = false
  draggingIndex.value = -1

  // 重新启用文本选择
  document.body.style.userSelect = ''
  document.body.style.webkitUserSelect = ''
  document.body.style.mozUserSelect = ''
  document.body.style.msUserSelect = ''
}

const saveSort = async () => {
  if (!hasChanges.value) {
    message.info('没有顺序变化需要保存')
    return
  }

  saving.value = true

  try {
    // 找到默认收藏夹
    const defaultFolder = folders.value.find(folder => isDefaultFolder(folder))
    // 获取排序后的用户收藏夹（排除默认收藏夹）
    const userFolders = sortedFolders.value.filter(folder => !isDefaultFolder(folder))
    const userFolderIds = userFolders.map(folder => folder.id)

    // 构建最终排序：默认收藏夹在前，用户收藏夹在后
    const finalSortIds = defaultFolder ? [defaultFolder.id, ...userFolderIds] : userFolderIds

    if (finalSortIds.length === 0) {
      message.warning('没有可排序的收藏夹')
      saving.value = false
      return
    }

    const result = await sortApi.executeSort(finalSortIds)

    // Tauri API返回SortResult对象
    if (result.success) {
      sortResult.value = {
        success: true,
        message: result.message
      }
      showResultModal.value = true
      message.success('收藏夹排序保存成功')
    } else {
      const errorMessage = result.message || '排序失败'
      sortResult.value = {
        success: false,
        message: errorMessage,
        isCsrfError: isCsrfError(errorMessage)
      }
      showResultModal.value = true

      // 如果是CSRF错误，提供更详细的帮助信息
      if (isCsrfError(errorMessage)) {
        message.error('CSRF token错误，请重新配置Cookie信息')
      } else {
        message.error('排序失败')
      }
    }
  } catch (err) {
    console.error('保存排序失败:', err)
    const errorMessage = err.message || '网络错误，请检查后端服务'
    sortResult.value = {
      success: false,
      message: errorMessage,
      isCsrfError: isCsrfError(errorMessage)
    }
    showResultModal.value = true

    // 如果是CSRF错误，提供更详细的帮助信息
    if (isCsrfError(errorMessage)) {
      message.error('CSRF token错误，请重新配置Cookie信息')
    } else {
      message.error('网络错误')
    }
  } finally {
    saving.value = false
  }
}

const refreshFolders = () => {
  showResultModal.value = false
  loadFolders()
}

// 清理函数，确保恢复文本选择
const cleanup = () => {
  document.body.style.userSelect = ''
  document.body.style.webkitUserSelect = ''
  document.body.style.mozUserSelect = ''
  document.body.style.msUserSelect = ''
}

// 生命周期
onMounted(() => {
  loadFolders()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.sort-panel {
  margin-bottom: 24px;
}

.loading-container {
  text-align: center;
  padding: 60px 0;
  color: #666;
}

.loading-container p {
  margin-top: 16px;
  font-size: 16px;
}

.folders-container {
  margin-bottom: 24px;
}

.folder-item {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.folder-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.folder-item.is-dragging {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
}

.folder-item.is-disabled {
  opacity: 0.6;
  background: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
}

.folder-item.is-disabled:hover {
  border-color: #d9d9d9;
  box-shadow: none;
}

.folder-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.drag-handle {
  cursor: move;
  color: #999;
  font-size: 16px;
  padding: 4px;
  transition: color 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.drag-handle:hover {
  color: #1890ff;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle.disabled-handle {
  cursor: not-allowed;
  color: #bfbfbf;
  pointer-events: none;
}

.drag-handle.disabled-handle:hover {
  color: #bfbfbf;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
  word-break: break-all;
}

.folder-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.folder-count {
  color: #1890ff;
  font-weight: 500;
}

.folder-id {
  color: #999;
  font-family: monospace;
}

.folder-actions {
  display: flex;
  gap: 4px;
}

.sort-stats {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.text-success {
  color: #52c41a;
  font-weight: 500;
}

.text-warning {
  color: #faad14;
  font-weight: 500;
}

/* 拖拽样式 */
.ghost {
  opacity: 0.5;
  background: #e6f7ff;
  border: 2px dashed #1890ff;
}

.chosen {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folder-content {
    padding: 12px;
  }

  .folder-title {
    font-size: 14px;
  }

  .folder-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .folder-actions {
    flex-direction: column;
    gap: 2px;
  }
}
</style>