<template>
  <div class="sort-favorites-page">
    <div class="page-header">
      <h1 class="page-title">
        <SortAscendingOutlined />
        收藏夹排序
      </h1>
      <p class="page-description">
        拖拽调整收藏夹顺序，让您的收藏夹更有条理
      </p>
    </div>

    <div class="page-content">
      <a-row :gutter="[24, 24]">
        <!-- 主要内容区域 -->
        <a-col :span="24" :lg="18">
          <SortPanel />
        </a-col>

        <!-- 侧边栏 -->
        <a-col :span="24" :lg="6">
          <a-card title="使用说明" :bordered="false" size="small">
            <div class="help-content">
              <div class="help-item">
                <NumberOutlined :style="{ color: '#1890ff' }" />
                <div class="help-text">
                  <strong>拖拽排序</strong>
                  <p>按住左侧菜单图标拖动收藏夹来调整顺序</p>
                </div>
              </div>
              <div class="help-item">
                <NumberOutlined :style="{ color: '#52c41a' }" />
                <div class="help-text">
                  <strong>按钮调整</strong>
                  <p>使用上下箭头按钮微调收藏夹位置</p>
                </div>
              </div>
              <div class="help-item">
                <NumberOutlined :style="{ color: '#faad14' }" />
                <div class="help-text">
                  <strong>保存更改</strong>
                  <p>调整完成后点击"保存排序"按钮应用更改</p>
                </div>
              </div>
              <div class="help-item">
                <NumberOutlined :style="{ color: '#f5222d' }" />
                <div class="help-text">
                  <strong>重置顺序</strong>
                  <p>点击"重置顺序"恢复到原始排列</p>
                </div>
              </div>
            </div>
          </a-card>

          <a-card title="注意事项" :bordered="false" size="small" style="margin-top: 16px">
            <a-alert
              message="排序说明"
              description="收藏夹排序将按照您在界面上的顺序从上到下排列。排序后，收藏夹在B站首页和收藏夹页面的显示顺序将相应改变。"
              type="info"
              show-icon
              style="margin-bottom: 12px"
            />
            <a-alert
              message="操作限制"
              description="请确保网络连接正常，排序操作需要与B站服务器通信。频繁排序可能会被限制，请合理使用。"
              type="warning"
              show-icon
            />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useConfigStore } from '../stores/config'
import SortPanel from '../components/SortPanel.vue'
import { SortAscendingOutlined, NumberOutlined } from '@ant-design/icons-vue'

const configStore = useConfigStore()

// 设置页面标题
document.title = '收藏夹排序 - 哔哩哔哩收藏夹清理工具'

onMounted(() => {
  // 检查配置状态
  configStore.checkConfig()
})
</script>

<style scoped>
.sort-favorites-page {
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-description {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
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
  .page-header {
    padding: 16px 0;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
    gap: 8px;
  }

  .page-description {
    font-size: 14px;
  }

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

@media (max-width: 576px) {
  .page-header {
    padding: 12px 0;
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .page-description {
    font-size: 13px;
  }
}
</style>