<template>
  <div v-if="toast.visible" class="toast">
    <div class="toast-content" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 300px;
}

.toast-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-left: 4px solid #667eea;
  animation: slideIn 0.3s ease;
}

.toast-content.success {
  border-left-color: #27ae60;
}

.toast-content.error {
  border-left-color: #e74c3c;
}

.toast-content.warning {
  border-left-color: #f39c12;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>