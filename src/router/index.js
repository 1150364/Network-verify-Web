import { createRouter, createWebHistory } from 'vue-router'
import BasicLayout from '../layout/BasicLayout.vue'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false 
    }
  },
  {
    path: '/',
    name: 'layout',
    component: BasicLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'cards',
        name: 'cards',
        component: () => import('../views/Cards.vue'),
        meta: { title: '卡密管理' }
      },
      {
        path: 'versions',
        name: 'versions',
        component: () => import('../views/Versions.vue'),
        meta: { title: '版本管理' }
      },
      {
        path: 'files',
        name: 'files',
        meta: { title: '文件管理', icon: 'Folder' },
        children: [
          {
            path: 'scores',
            name: 'scores',
            component: () => import('../views/files/Scores.vue'),
            meta: { title: '曲谱管理' }
          }
        ]
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('../views/Orders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'online',
        name: 'online',
        component: () => import('../views/Online.vue'),
        meta: { title: '在线用户' }
      }
    ]
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/404.vue'),
    meta: { 
      title: '404 Not Found',
      requiresAuth: false 
    }
  },
  // {
  //   path: '/:pathMatch(.*)*',
  //   redirect: '/404'
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 管理系统` : '管理系统'

  const userStore = useUserStore()

  // 如果要去登录页，直接放行
  if (to.path === '/login') {
    next()
    return
  }

  // 只在进入需要认证的页面时检查登录状态
  if (to.meta.requiresAuth !== false && !(await userStore.checkLoginStatus())) {
    next('/login')
    return
  }


  console.log(to.fullPath);
  console.log(router.hasRoute(to.name));
  console.log(userStore.userType);
  
  // 如果路由不存在且用户是管理员，可能是动态路由还没加载完成
  if (!router.hasRoute(to.name) && userStore.userType === '管理员') {
    if (to.fullPath.startsWith('/info') || to.fullPath.startsWith('/files/images') || to.fullPath.startsWith('/features')) {
      next({ ...to, replace: true })
      return
    }
  }

  // 如果路由不存在且不是子路由，跳转到404
  if (!router.hasRoute(to.name) && !to.matched.length && to.name != '404') {
    next('/404')
    return
  }

  next()
})

export default router 