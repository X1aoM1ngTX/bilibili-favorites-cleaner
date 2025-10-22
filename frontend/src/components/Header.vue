<template>
  <header class="header">
    <h1 class="title">哔哩哔哩收藏夹清理工具</h1>
    <p class="subtitle">一键清理所有收藏夹中的失效内容</p>
  </header>
</template>

<script setup>
</script>

<style scoped>
.header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 300;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}
</style>