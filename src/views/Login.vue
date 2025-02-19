<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">后台管理系统</h2>
      
      <el-form 
        :model="loginForm" 
        :rules="rules" 
        ref="loginFormRef"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-button" 
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, message: '用户名不能少于4个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, message: '密码不能少于4个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await request({
          url: '/admin/login',
          method: 'post',
          data: {
            username: loginForm.username,
            password: loginForm.password
          }
        })
        
        if (res.status === 0) {
          ElMessage.success('登录成功')
          userStore.setUserInfo(res.data.user)
          userStore.setLoginStatus(true)
          window.location.href = '/'
        } else {
          ElMessage.error(res.msg)
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.msg || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7f9;
}

.login-box {
  width: 380px;
  padding: 35px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.login-title {
  margin: 0 0 35px;
  color: #1f2f3d;
  font-size: 22px;
  text-align: center;
  font-weight: 500;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 25px;
}

.login-form :deep(.el-input__wrapper) {
  background-color: #f5f7f9;
  box-shadow: none;
  border: 1px solid transparent;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #dcdfe6;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  border-color: var(--el-color-primary);
  box-shadow: none;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 15px;
  letter-spacing: 1px;
}

/* 移动端配 */
@media screen and (max-width: 768px) {
  .login-box {
    width: 85%;
    max-width: 380px;
    padding: 25px;
  }

  .login-title {
    font-size: 20px;
    margin-bottom: 25px;
  }
}
</style> 