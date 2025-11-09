<template>
  <a-space direction="vertical" size="large" style="width: 100%; max-width: 800px; margin: 0 auto;">
    <!-- 头部说明 -->
    <a-card :bordered="false">
      <div style="text-align: center;">
        <a-typography-title :level="3">移动收藏夹视频</a-typography-title>
        <a-typography-paragraph type="secondary">
          将一个收藏夹的视频移动到另一个收藏夹。系统会自动计算可移动的视频数量，确保目标收藏夹不超过1000个视频的上限。
        </a-typography-paragraph>
      </div>
    </a-card>

    <!-- 收藏夹选择 -->
    <a-card title="收藏夹选择" :bordered="false">
      <a-row :gutter="24" align="middle">
        <a-col :xs="24" :md="10">
          <a-form-item label="源收藏夹" :label-col="{ span: 24 }" :wrapper-col="{ span: 24 }">
            <a-select
              v-model:value="selectedSourceFolder"
              :disabled="isLoading || favoritesStore.isLoading"
              placeholder="请选择源收藏夹"
              :filter-option="filterOption"
              show-search
            >
              <a-select-option
                v-for="folder in favoritesStore.favorites"
                :key="folder.id"
                :value="folder.id"
                :disabled="folder.id === selectedTargetFolder"
              >
                {{ folder.title }} ({{ folder.media_count }}个视频)
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="4" style="text-align: center;">
          <ArrowRightOutlined style="font-size: 24px; color: #1890ff;" />
        </a-col>

        <a-col :xs="24" :md="10">
          <a-form-item label="目标收藏夹" :label-col="{ span: 24 }" :wrapper-col="{ span: 24 }">
            <a-select
              v-model:value="selectedTargetFolder"
              :disabled="isLoading || favoritesStore.isLoading"
              placeholder="请选择目标收藏夹"
              :filter-option="filterOption"
              show-search
            >
              <a-select-option
                v-for="folder in favoritesStore.favorites"
                :key="folder.id"
                :value="folder.id"
                :disabled="folder.id === selectedSourceFolder"
              >
                {{ folder.title }} ({{ folder.media_count }}个视频)
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <div style="text-align: center; margin-top: 24px;">
        <a-button
          type="primary"
          @click="calculateMovableCount"
          :disabled="!canCalculate || isCalculating"
          :loading="isCalculating"
        >
          <template #icon><CalculatorOutlined /></template>
          计算可移动数量
        </a-button>
      </div>
    </a-card>

    <!-- 计算结果显示 -->
    <a-card v-if="calculationResult" title="移动信息" :bordered="false">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="源收藏夹">
          {{ calculationResult.srcFolder.title }} ({{ calculationResult.srcFolder.media_count }}个视频)
        </a-descriptions-item>
        <a-descriptions-item label="目标收藏夹">
          {{ calculationResult.tarFolder.title }} ({{ calculationResult.tarFolder.media_count }}个视频)
        </a-descriptions-item>
        <a-descriptions-item label="可移动数量" :class="{ 'highlight-item': true }">
          <a-statistic :value="calculationResult.movableCount" suffix="个视频" />
        </a-descriptions-item>
      </a-descriptions>

      <a-alert
        v-if="!calculationResult.canMove"
        :message="calculationResult.tarFolder.media_count >= 1000 ? '目标收藏夹已满（1000个视频上限）' : '没有可移动的视频'"
        type="warning"
        show-icon
        style="margin-top: 16px;"
      />
    </a-card>

    <!-- 执行移动按钮 -->
    <div style="text-align: center;">
      <a-button
        type="primary"
        danger
        size="large"
        @click="executeMove"
        :disabled="!canMove || isMoving"
        :loading="isMoving"
      >
        <template #icon><SwapOutlined /></template>
        开始移动 {{ calculationResult?.movableCount || 0 }} 个视频
      </a-button>
    </div>

    <!-- 移动结果显示 -->
    <a-card v-if="moveResult" :bordered="false">
      <a-result
        :status="moveResult.success ? 'success' : 'error'"
        :title="moveResult.success ? '移动成功' : '移动失败'"
      >
        <template #extra v-if="!moveResult.success">
          <a-alert :message="moveResult.error" type="error" />
        </template>
      </a-result>

      <div v-if="moveResult.success" style="margin-top: 24px;">
        <a-descriptions title="移动详情" :column="1" bordered>
          <a-descriptions-item label="已移动视频">
            <a-statistic :value="moveResult.data.movedCount" suffix="个" />
          </a-descriptions-item>
          <a-descriptions-item label="源收藏夹剩余">
            <a-statistic :value="moveResult.data.srcFolder.remainingCount" suffix="个" />
          </a-descriptions-item>
          <a-descriptions-item label="目标收藏夹现有">
            <a-statistic :value="moveResult.data.tarFolder.newCount" suffix="个" />
          </a-descriptions-item>
        </a-descriptions>

        <!-- 移动的视频列表 -->
        <div v-if="moveResult.data.videos.length > 0" style="margin-top: 24px;">
          <a-typography-title :level="5">已移动的视频：</a-typography-title>
          <a-list
            :data-source="moveResult.data.videos.slice(0, 5)"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a-typography-text>{{ item.title }}</a-typography-text>
                  </template>
                  <template #description>
                    <a-typography-text type="secondary">
                      UP: {{ item.upper }} | BV: {{ item.bvid }}
                    </a-typography-text>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
          <div v-if="moveResult.data.videos.length > 5" style="text-align: center; margin-top: 12px;">
            <a-typography-text type="secondary">
              还有 {{ moveResult.data.videos.length - 5 }} 个视频...
            </a-typography-text>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 错误信息 -->
    <a-alert
      v-if="error"
      :message="error"
      type="error"
      show-icon
    />
  </a-space>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useFavoritesStore } from '../stores/favorites'
import { useNotification } from '../utils/notification'
import { api } from '../utils/api'
import {
  ArrowRightOutlined,
  CalculatorOutlined,
  SwapOutlined
} from '@ant-design/icons-vue'

const favoritesStore = useFavoritesStore()
const notification = useNotification()

// 状态
const selectedSourceFolder = ref('')
const selectedTargetFolder = ref('')
const isCalculating = ref(false)
const isMoving = ref(false)
const isLoading = ref(false)
const calculationResult = ref(null)
const moveResult = ref(null)
const error = ref('')

// 计算属性
const canCalculate = computed(() => {
  return selectedSourceFolder.value &&
         selectedTargetFolder.value &&
         selectedSourceFolder.value !== selectedTargetFolder.value
})

const canMove = computed(() => {
  return calculationResult.value &&
         calculationResult.value.canMove &&
         calculationResult.value.movableCount > 0
})

// 计算可移动的视频数量
async function calculateMovableCount() {
  if (!canCalculate.value) return

  isCalculating.value = true
  error.value = ''
  calculationResult.value = null

  try {
    const response = await api.get(`/move/calculate?srcMediaId=${selectedSourceFolder.value}&tarMediaId=${selectedTargetFolder.value}`)
    calculationResult.value = response.data
  } catch (err) {
    error.value = err.message || '计算可移动数量失败'
    notification.error(error.value)
  } finally {
    isCalculating.value = false
  }
}

// 执行移动操作
async function executeMove() {
  if (!canMove.value) return

  isMoving.value = true
  error.value = ''
  moveResult.value = null

  try {
    const response = await api.post('/move/execute', {
      srcMediaId: selectedSourceFolder.value,
      tarMediaId: selectedTargetFolder.value
    })

    moveResult.value = { success: true, data: response.data }
    notification.success(`成功移动 ${response.data.movedCount} 个视频`)

    // 刷新收藏夹列表
    await favoritesStore.loadFavorites()

    // 重置选择
    selectedSourceFolder.value = ''
    selectedTargetFolder.value = ''
    calculationResult.value = null

  } catch (err) {
    error.value = err.message || '移动视频失败'
    moveResult.value = { success: false, error: error.value }
    notification.error(error.value)
  } finally {
    isMoving.value = false
  }
}

// 监听收藏夹选择变化
watch([selectedSourceFolder, selectedTargetFolder], () => {
  calculationResult.value = null
  moveResult.value = null
  error.value = ''
})

// 搜索过滤方法
function filterOption(input, option) {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 组件挂载时加载收藏夹
onMounted(async () => {
  if (favoritesStore.favorites.length === 0) {
    await favoritesStore.loadFavorites()
  }
})
</script>

<style scoped>
.highlight-item {
  background: #fff7e6;
}

.highlight-item :deep(.ant-descriptions-item-label) {
  background: #fff7e6;
  font-weight: 600;
}
</style>