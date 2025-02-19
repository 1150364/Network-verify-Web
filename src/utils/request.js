import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useUserStore } from '../stores/user'

const service = axios.create({
  baseURL: '',
  timeout: 5000,
  withCredentials: true
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 登录页面只允许发送登录请求
    if (window.location.pathname === '/login' && config.url !== '/admin/login') {
      return Promise.reject(new Error('登录页面只允许发送登录请求'))
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 如果是预览文件，直接返回 response
    if (response.config.responseType === 'text') {
      return response
    }
    
    const res = response.data
    
    if (res.status == -1) {
      const userStore = useUserStore()
      // 如果不是在登录页，才执行登出操作
      if (window.location.pathname !== '/login') {
        userStore.logout()
        router.replace('/login')
      }
      return Promise.reject(new Error(res.msg || '未登录'))
    }
    // 根据状态码处理响应
    if (res.status == 0 || res.status == 2) {
      return res
    } else {
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const userStore = useUserStore()
      // 如果不是在登录页，才执行登出操作
      if (window.location.pathname !== '/login') {
        userStore.logout()
        router.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default service 