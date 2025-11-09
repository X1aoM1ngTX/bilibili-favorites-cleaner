<template>
  <div class="move-panel">
    <a-row :gutter="[24, 24]">
      <!-- 主要内容区域 -->
      <a-col :span="24" :lg="16">
        <a-card title="移动视频" :bordered="false">
          <a-form layout="vertical">
            <a-form-item label="源收藏夹">
              <a-select
                v-model:value="sourceId"
                placeholder="请选择源收藏夹"
                style="width: 100%"
                @change="onSourceChange"
              >
                <a-select-option
                  v-for="folder in folders"
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === targetId"
                >
                  {{ folder.title }} ({{ folder.media_count }} 个视频)
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="目标收藏夹">
              <a-select
                v-model:value="targetId"
                placeholder="请选择目标收藏夹"
                style="width: 100%"
                @change="onTargetChange"
              >
                <a-select-option
                  v-for="folder in folders"
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === sourceId"
                >
                  {{ folder.title }} ({{ folder.media_count }} 个视频)
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button
                  type="primary"
                  @click="calculateMovable"
                  :disabled="!sourceId || !targetId || sourceId === targetId"
                  :loading="calculating"
                >
                  <template #icon><CalculatorOutlined /></template>
                  计算可移动数量
                </a-button>
                <a-button
                  type="primary"
                  @click="executeMove"
                  :disabled="!canMove || moving"
                  :loading="moving"
                >
                  <template #icon><SwapOutlined /></template>
                  执行移动
                </a-button>
              </a-space>
            </a-form-item>
          </a-form>

          <!-- 计算结果 -->
          <div v-if="calculateResult" class="calculate-result">
            <a-alert
              :message="`可移动 ${calculateResult.movable_count} 个视频`"
              :description="calculateResult.can_move ?
                `从「${calculateResult.src_folder?.title}」移动到「${calculateResult.tar_folder?.title}」` :
                '目标收藏夹已满或源收藏夹为空'"
              :type="calculateResult.can_move ? 'success' : 'warning'"
              show-icon
            />
          </div>

          <!-- 移动结果 -->
          <div v-if="moveResult" class="move-result">
            <a-result
              :status="moveResult.moved_count > 0 ? 'success' : 'info'"
              :title="moveResult.message || '移动完成'"
            >
              <template #extra>
                <a-button type="primary" @click="refreshData">
                  <template #icon><ReloadOutlined /></template>
                  刷新数据
                </a-button>
              </template>
            </a-result>

            <!-- 移动的视频列表 -->
            <div v-if="moveResult.videos && moveResult.videos.length > 0" class="moved-videos">
              <h4>已移动的视频：</h4>
              <a-list
                :data-source="moveResult.videos"
                size="small"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>
                        <a :href="`https://www.bilibili.com/video/${item.bvid}`" target="_blank">
                          {{ item.title }}
                        </a>
                      </template>
                      <template #description>
                        <a-space>
                          <span>UP: {{ item.upper || '未知' }}</span>
                          <span>时长: {{ formatDuration(item.duration) }}</span>
                        </a-space>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 侧边栏 -->
      <a-col :span="24" :lg="8">
        <a-card title="使用说明" :bordered="false" size="small">
          <div class="help-content">
            <div class="help-item">
              <NumberOutlined :style="{ color: '#1890ff' }" />
              <div class="help-text">
                <strong>选择收藏夹</strong>
                <p>分别选择源收藏夹和目标收藏夹</p>
              </div>
            </div>
            <div class="help-item">
              <NumberOutlined :style="{ color: '#52c41a' }" />
              <div class="help-text">
                <strong>计算数量</strong>
                <p>点击"计算可移动数量"查看可以移动的视频数量</p>
              </div>
            </div>
            <div class="help-item">
              <NumberOutlined :style="{ color: '#faad14' }" />
              <div class="help-text">
                <strong>执行移动</strong>
                <p>点击"执行移动"开始移动视频（按收藏时间倒序）</p>
              </div>
            </div>
          </div>
        </a-card>

        <a-card title="注意事项" :bordered="false" size="small" style="margin-top: 16px">
          <a-alert
            message="收藏夹限制"
            description="每个收藏夹最多可包含1000个视频，移动时会自动检查目标收藏夹的剩余空间"
            type="info"
            show-icon
            style="margin-bottom: 12px"
          />
          <a-alert
            message="移动顺序"
            description="视频将按照收藏时间倒序移动，即最新收藏的视频优先移动"
            type="warning"
            show-icon
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { useNotification } from '../utils/notification'
import { moveApi } from '../utils/tauri-api'
import {
  CalculatorOutlined,
  SwapOutlined,
  ReloadOutlined,
  NumberOutlined
} from '@ant-design/icons-vue'

const configStore = useConfigStore()
const notification = useNotification()

// 状态
const folders = ref([])
const sourceId = ref(null)
const targetId = ref(null)
const calculating = ref(false)
const moving = ref(false)
const calculateResult = ref(null)
const moveResult = ref(null)
const movableVideos = ref([])

// 计算属性
const canMove = computed(() => {
  return calculateResult.value && calculateResult.value.can_move && calculateResult.value.movable_count > 0
})

// 方法
async function loadFolders() {
  if (!configStore.isConfigured) {
    notification.error('请先配置Cookie')
    return
  }

  try {
    const result = await moveApi.getFavorites()
    folders.value = result || []
  } catch (error) {
    console.error('获取收藏夹列表失败:', error)
    notification.error('获取收藏夹列表失败: ' + error.message)
  }
}

async function onSourceChange() {
  calculateResult.value = null
  moveResult.value = null
}

async function onTargetChange() {
  calculateResult.value = null
  moveResult.value = null
}

async function calculateMovable() {
  if (!sourceId.value || !targetId.value || sourceId.value === targetId.value) {
    notification.warning('请选择不同的源收藏夹和目标收藏夹')
    return
  }

  calculating.value = true

  try {
    const videos = await moveApi.getVideos(sourceId.value, targetId.value)
    movableVideos.value = videos
    calculateResult.value = {
      src_folder: folders.value.find(f => f.id === sourceId.value),
      tar_folder: folders.value.find(f => f.id === targetId.value),
      movable_count: videos.length,
      can_move: videos.length > 0,
      canMove: videos.length > 0
    }
  } catch (error) {
    console.error('计算可移动数量失败:', error)
    notification.error('计算可移动数量失败: ' + error.message)
  } finally {
    calculating.value = false
  }
}

async function executeMove() {
  if (!canMove.value) {
    notification.warning('没有可移动的视频')
    return
  }

  moving.value = true

  try {
    // 提取视频ID列表
    const videoIds = movableVideos.value.map(video => video.id)
    const result = await moveApi.moveVideos(sourceId.value, targetId.value, videoIds)
    moveResult.value = result
    
    if (result.moved_count > 0) {
      notification.success(`成功移动 ${result.moved_count} 个视频`)
    } else {
      notification.info(result.message || '移动失败')
    }
  } catch (error) {
    console.error('移动视频失败:', error)
    notification.error('移动视频失败: ' + error.message)
  } finally {
    moving.value = false
  }
}

function formatDuration(seconds) {
  if (!seconds) return '00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

async function refreshData() {
  moveResult.value = null
  calculateResult.value = null
  movableVideos.value = []
  await loadFolders()
}

// 生命周期
onMounted(() => {
  loadFolders()
})
</script>

<style scoped>
.move-panel {
  min-height: 100vh;
}

.calculate-result {
  margin-top: 16px;
}

.move-result {
  margin-top: 16px;
}

.moved-videos {
  margin-top: 16px;
}

.moved-videos h4 {
  margin-bottom: 12px;
  color: #262626;
}

.help-content {
  padding: 8px 0;
}

.help-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.help-item:hover {
  background: #f0f8ff;
}

.help-item:last-child {
  margin-bottom: 0;
}

.help-text {
  flex: 1;
}

.help-text strong {
  display: block;
  margin-bottom: 4px;
  color: #262626;
  font-size: 14px;
}

.help-text p {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-item {
    padding: 8px;
    margin-bottom: 12px;
  }

  .help-text strong {
    font-size: 13px;
  }

  .help-text p {
    font-size: 12px;
  }
}
</style>