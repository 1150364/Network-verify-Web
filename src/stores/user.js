import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '../router'
import request from '../utils/request'

// 动态路由配置

const asyncRoutes_files = {
  path: 'images',
  name: 'images',
  component: () => import('../views/files/Images.vue'),
  meta: { title: '图片管理' }
}

const asyncRoutes_info = {
  path: '/info',
  name: 'info',
  meta: { title: '信息管理', icon: 'InfoFilled' },
  children: [
    {
      path: 'characters',
      name: 'characters',
      component: () => import('../views/info/CharacterList.vue'),
      meta: { title: '人物管理' }
    },
    {
      path: 'props',
      name: 'props',
      component: () => import('../views/info/PropList.vue'),
      meta: { title: '道具管理' }
    },
    {
      path: 'pending',
      name: 'pending',
      component: () => import('../views/info/PendingList.vue'),
      meta: { title: '待审核' }
    }
  ]
}




export const useUserStore = defineStore('user', {
  state: () => {
    return {
      isLogin: false,
      userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
      routesAdded: false
    }
  },

  actions: {
    setLoginStatus(status) {
      this.isLogin = status
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      // 登录成功后添加动态路由
      this.addRoutes()
    },

    // 添加动态路由
    addRoutes() {
      console.log(this.routesAdded);
      if (this.userType === '管理员' && !this.routesAdded) {
        router.addRoute('files', asyncRoutes_files)
        router.addRoute('layout', asyncRoutes_info)
        router.addRoute('layout', {
          path: 'features',
          name: 'features',
          component: () => import('../views/Features.vue'),
          meta: { title: '特征码管理' }
        })

        this.routesAdded = true
      }
    },

    async checkLoginStatus() {
      if (this._checking) {
        return this.isLogin
      }

      if (router.currentRoute.value.path == '/login') {
        this.isLogin = false
        this.userInfo = null
        this.routesAdded = false
        localStorage.removeItem('userInfo')
        return false
      }

      if (this.isLogin && this.userInfo) {
        return true
      }

      this._checking = true
      try {
        const res = await request({
          url: '/admin/user',
          method: 'get'
        })
        if (res.status === 0) {
          this.setLoginStatus(true)
          this.setUserInfo(res.data.user)
          return true
        } else if (res.status === -1) {
          this.logout()
          return false
        }
        this.logout()
        return false
      } catch (error) {
        this.logout()
        return false
      } finally {
        this._checking = false
      }
    },

    async logout(sendRequest = false) {
      if (router.currentRoute.value.path === '/login') {
        this.isLogin = false
        this.userInfo = null
        this.routesAdded = false
        localStorage.removeItem('userInfo')
        return
      }

      if (sendRequest) {
        try {
          await request({
            url: '/admin/logout',
            method: 'post'
          })
        } catch (error) {
          console.error('退出登录失败:', error)
        }
      }

      this.isLogin = false
      this.userInfo = null
      this.routesAdded = false
      localStorage.removeItem('userInfo')
      router.replace('/login')
    }
  },

  getters: {
    userType: (state) => state.userInfo?.type || '',
    username: (state) => state.userInfo?.username || '',
    userState: (state) => state.userInfo?.state || ''
  }
}) 