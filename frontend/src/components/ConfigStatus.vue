<template>
  <section class="config-status">
    <div class="status-card">
      <h3>配置状态</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="configStore.statusClass"></span>
        <span class="status-text">{{ configStore.statusText }}</span>
      </div>
      <div v-if="configStore.isConfigured" class="user-info">
        <span>用户ID: <strong>{{ configStore.config.up_mid }}</strong></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()
</script>

<style scoped>
.config-status {
  margin-bottom: 20px;
}

.status-card {
  background: rgba(255,255,255,0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.status-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e74c3c;
  animation: pulse 2s infinite;
}

.status-dot.configured {
  background: #27ae60;
}

.status-dot.checking {
  background: #f39c12;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  font-weight: 600;
  color: #2c3e50;
}

.user-info {
  color: #7f8c8d;
  font-size: 0.9rem;
}
</style>