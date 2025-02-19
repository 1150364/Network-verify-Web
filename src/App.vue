<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100vh;
}

/* 添加移动端通用样式 */
@media screen and (max-width: 768px) {
  .el-card__header {
    padding: 10px !important;
  }
  
  .el-card__body {
    padding: 10px !important;
  }
  
  .el-table {
    margin: 0 -10px;
    width: calc(100% + 20px) !important;
  }
  
  .el-dialog {
    width: 90% !important;
    margin: 0 auto !important;
  }
  
  .el-form-item {
    margin-bottom: 15px !important;
  }
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
