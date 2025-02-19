<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isMobile ? '0' : (isCollapse ? '64px' : '200px')" class="aside">
      <el-menu :default-active="activeMenu" class="sidebar-menu" background-color="#304156" text-color="#fff"
        active-text-color="#409EFF" :router="true" :collapse="isCollapse">
        <el-menu-item index="/dashboard">
          <el-icon>
            <DataLine />
          </el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon>
            <User />
          </el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/online">
          <el-icon>
            <Connection />
          </el-icon>
          <template #title>在线用户</template>
        </el-menu-item>
        <el-menu-item index="/cards">
          <el-icon>
            <CreditCard />
          </el-icon>
          <template #title>卡密管理</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon>
            <Tickets />
          </el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/versions">
          <el-icon>
            <List />
          </el-icon>
          <template #title>版本管理</template>
        </el-menu-item>
        <template v-if="userStore.userType === '管理员'">
          <el-menu-item index="/features">
            <el-icon>
              <Key />
            </el-icon>
            <template #title>特征码管理</template>
          </el-menu-item>
        </template>
        

        <el-sub-menu index="files">
          <template #title>
            <el-icon>
              <Folder />
            </el-icon>
            <span>文件管理</span>
          </template>
          <template v-if="userStore.userType === '管理员'"><el-menu-item index="/files/images">图片管理</el-menu-item>
          </template>

          <el-menu-item index="/files/scores">曲谱管理</el-menu-item>
        </el-sub-menu>
        <template v-if="userStore.userType === '管理员'">
          <el-sub-menu index="info">
            <template #title>
              <el-icon>
                <UserFilled />
              </el-icon>
              <span>信息管理</span>
            </template>
            <el-menu-item index="/info/characters">人物列表</el-menu-item>
            <el-menu-item index="/info/props">道具列表</el-menu-item>
            <el-menu-item index="/info/pending">待审核列表</el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header height="60px">
        <div class="header-container">
          <div class="left">
            <el-icon class="fold-btn" @click="isMobile ? toggleDrawer() : toggleSidebar()">
                <component :is="isMobile ? drawerVisible ? Fold : Expand : isCollapse ? Expand : Fold" />
              </el-icon>
          </div>
          <div class="right">
            <el-dropdown>
              <span class="user-info">
                {{ userStore.username }}
                <el-tag size="small" style="margin: 0 8px">{{ userStore.userType }}</el-tag>
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主要内容区 -->
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 移动端抽屉菜单 -->
    <el-drawer v-model="drawerVisible" direction="ltr" size="200px" :with-header="false">
      <el-menu :default-active="activeMenu" class="drawer-menu" background-color="#304156" text-color="#fff"
        active-text-color="#409EFF" :router="true" @select="closeDrawer">
        <el-menu-item index="/dashboard">
          <el-icon>
            <DataLine />
          </el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon>
            <User />
          </el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/online">
          <el-icon>
            <Connection />
          </el-icon>
          <template #title>在线用户</template>
        </el-menu-item>
        <el-menu-item index="/cards">
          <el-icon>
            <CreditCard />
          </el-icon>
          <template #title>卡密管理</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon>
            <Tickets />
          </el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/versions">
          <el-icon>
            <List />
          </el-icon>
          <template #title>版本管理</template>
        </el-menu-item>
        <template v-if="userStore.userType === '管理员'">
          <el-menu-item index="/features">
            <el-icon>
              <Key />
            </el-icon>
            <template #title>特征码管理</template>
          </el-menu-item>
        </template>


        <el-sub-menu index="files">
          <template #title>
            <el-icon>
              <Folder />
            </el-icon>
            <span>文件管理</span>
          </template>
          <template v-if="userStore.userType === '管理员'">
            <el-menu-item index="/files/images">图片管理</el-menu-item>
          </template>
          <el-menu-item index="/files/scores">曲谱管理</el-menu-item>
        </el-sub-menu>
        <template v-if="userStore.userType === '管理员'">
          <el-sub-menu index="info">
            <template #title>
              <el-icon>
                <UserFilled />
              </el-icon>
              <span>信息管理</span>
            </template>
            <el-menu-item index="/info/characters">人物列表</el-menu-item>
            <el-menu-item index="/info/props">道具列表</el-menu-item>
            <el-menu-item index="/info/pending">待审核列表</el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLine,
  Fold,
  Expand,
  ArrowDown,
  User,
  CreditCard,
  List,
  Folder,
  UserFilled,
  Tickets,
  Connection,
  Key
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)

const isCollapse = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)

const userStore = useUserStore()

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

const closeDrawer = () => {
  drawerVisible.value = false
}

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    drawerVisible.value = false
  }
}

// 监听窗口大小变化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const handleLogout = () => {
  userStore.logout(true)
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  transition: width 0.3s;
  background-color: #304156;
  overflow: hidden;
}

.sidebar-menu {
  height: 100%;
  border-right: none;
  transition: width 0.3s;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 15px;
}

.left,
.right {
  display: flex;
  align-items: center;
  height: 100%;
}

.fold-btn {
  font-size: 20px;
  cursor: pointer;
  color: #303133;
  display: flex;
  align-items: center;
}

.fold-btn:hover {
  color: #409EFF;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 5px;
}

/* 移动端样式 */
@media screen and (max-width: 768px) {
  .header-container {
    padding: 0 10px;
  }

  .user-info {
    font-size: 14px;
  }

  :deep(.el-drawer) {
    padding: 0;
  }

  :deep(.el-drawer__body) {
    padding: 0;
    overflow: hidden;
  }
}

.drawer-menu {
  border-right: none;
  height: 100%;
  width: 100%;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  transition: background-color 0.3s, color 0.3s;
}

:deep(.el-menu--collapse .el-sub-menu__title) span,
:deep(.el-menu--collapse .el-menu-item) span {
  height: 0;
  width: 0;
  overflow: hidden;
  visibility: hidden;
  display: inline-block;
  transition: opacity 0.3s;
}

:deep(.el-drawer__body) {
  transition: transform 0.3s;
}

/* 内容区域切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>