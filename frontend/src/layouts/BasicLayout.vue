<template>
  <a-layout class="basic-layout">
    <a-layout-header class="header">
      <div class="header-content">
        <div class="logo">
          <VideoCameraOutlined style="font-size: 24px; color: #1890ff;" />
          <span class="title">哔哩哔哩收藏夹清理工具</span>
        </div>
        <div class="nav-menu">
          <router-link to="/" class="nav-item" :class="{ active: $route.name === 'Home' }">
            登录配置
          </router-link>
          <router-link to="/fav/clear" class="nav-item" :class="{ active: $route.name === '清理收藏夹' }">
            清理收藏夹
          </router-link>
          <router-link to="/fav/move" class="nav-item" :class="{ active: $route.name === '移动视频' }">
            移动视频
          </router-link>
        </div>
        <div class="config-status">
          <a-badge :status="statusBadgeType" :text="configStore.statusText" />
          <span v-if="configStore.isConfigured" class="user-id">ID: {{ configStore.config.up_mid }}</span>
        </div>
      </div>
    </a-layout-header>
    <a-layout-content class="content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </a-layout-content>
    <a-layout-footer class="footer">
      <div class="footer-content">
        <span>© 2025 Bilibili Favorites Cleaner</span>
        <a-divider type="vertical" />
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          <GithubOutlined /> GitHub
        </a>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

<script setup>
import { computed } from 'vue'
import { GithubOutlined, VideoCameraOutlined } from '@ant-design/icons-vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const statusBadgeType = computed(() => {
  switch (configStore.statusClass) {
    case 'configured':
      return 'success'
    case 'checking':
      return 'processing'
    default:
      return 'error'
  }
})
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.config-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-id {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 8px 16px;
  color: #666;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-item:hover {
  color: #1890ff;
  background-color: #f0f8ff;
}

.nav-item.active {
  color: #1890ff;
  background-color: #e6f7ff;
}

.content {
  margin-top: 64px;
  padding: 24px;
  min-height: calc(100vh - 64px - 70px);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.footer {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 16px 24px;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  color: #666;
  font-size: 14px;
}

.footer-content a {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-content a:hover {
  color: #40a9ff;
}

@media (max-width: 768px) {
  .content {
    padding: 16px;
  }

  .header-content {
    padding: 0 16px;
    gap: 8px;
  }

  .title {
    font-size: 16px;
  }

  .nav-menu {
    gap: 4px;
  }

  .nav-item {
    padding: 6px 12px;
    font-size: 14px;
  }

  .config-status {
    gap: 8px;
  }

  .user-id {
    font-size: 12px;
  }

  .footer {
    padding: 12px 16px;
  }
}

@media (max-width: 576px) {
  .nav-menu {
    display: none;
  }
}
</style>
