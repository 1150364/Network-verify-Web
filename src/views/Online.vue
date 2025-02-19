<template>
  <div class="online-container">
    <el-card v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)"
      :element-loading-svg="loadingSvg" element-loading-svg-view-box="-10, -10, 50, 50">
      <template #header>
        <div class="header">
          <div class="left">
            <el-button type="primary" @click="handleRefresh">
              <el-icon>
                <Refresh />
              </el-icon>
              刷新列表
            </el-button>
            <el-button v-if="userStore.userType === '管理员'" type="success" @click="handleBroadcast">
              <el-icon>
                <ChatDotSquare />
              </el-icon>
              发送全局消息
            </el-button>
          </div>
          <div class="right">
            <el-input v-model="searchKeyword" placeholder="用户名/机器码" style="width: 200px" clearable
              @clear="handleSearch" />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange"
        :default-sort="{ prop: 'loginTime', order: 'descending' }">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="200">
          <template #default="{ row }">
            <el-tag v-if="!row.username" type="warning">未登录</el-tag>
            <span v-else>{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="device" label="设备描述" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.device" placement="top" :show-after="500">
              <span>{{ row.device }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="md5" label="版本MD5" width="290" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.md5" placement="top" :show-after="500">
              <span>{{ row.md5 }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="机器码" width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.code" placement="top" :show-after="500">
              <span>{{ row.code }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="address" label="地理位置" width="170" show-overflow-tooltip />
        <el-table-column prop="expire_time" label="到期时间" width="180" align="center">
          <template #default="{ row }">
            <template v-if="row.username">
              <el-tag :type="isExpired(row.expire_time) ? 'danger' : 'success'" effect="plain">
                {{ row.expire_time || '-' }}
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="login_time" label="登录时间" width="180" sortable="custom" align="center">
          <template #default="{ row }">
            <span>{{ row.username ? row.login_time : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="heart_time" label="最后心跳" width="180" sortable="custom" align="center" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <template v-if="userStore.userType === '管理员'">
              <el-button type="primary" link @click="handleCapture(row)">
                <el-icon>
                  <Camera />
                </el-icon>
                捕获截图
              </el-button>
            </template>

            <el-button type="success" link @click="handleMessage(row)">
              <el-icon>
                <ChatDotRound />
              </el-icon>
              发送消息
            </el-button>

            <el-button type="danger" link @click="handleKickout(row)">
              <el-icon>
                <CircleClose />
              </el-icon>
              踢下线
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera, ChatDotRound, CircleClose, Refresh, ChatDotSquare } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 判断是否过期
const isExpired = (expireTime) => {
  if (!expireTime) return false
  return new Date(expireTime) < new Date()
}

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const sortLogin = ref(1)  // 登录时间排序，默认倒序
const sortHeart = ref(null)  // 心跳时间排序
const tableData = ref([
  {
    id: 1,
    username: 'test001',
    code: 'ABCD-EFGH-IJKL-MNOP',
    ip: '192.168.1.100',
    location: '广东省深圳市',
    login_time: '2024-03-15 10:30:25',
    heart_time: '2024-03-15 10:35:25',
    device: 'Windows 10 Pro x64',
    md5: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    expire_time: '2024-12-31 23:59:59'
  },
  {
    id: 2,
    username: 'test002',
    code: 'QRST-UVWX-YZAB-CDEF',
    ip: '192.168.1.101',
    location: '北京市朝阳区',
    login_time: '2024-03-15 09:20:15',
    heart_time: '2024-03-15 09:25:15',
    device: 'Windows 11 Home x64',
    md5: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
    expire_time: '2024-06-30 23:59:59'
  },
  {
    id: 3,
    username: 'test003',
    code: 'GHIJ-KLMN-OPQR-STUV',
    ip: '192.168.1.102',
    location: '上海市浦东新区',
    login_time: '2024-03-15 08:10:05',
    heart_time: '2024-03-15 08:15:05',
    device: 'Windows 10 Enterprise x64',
    md5: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
    expire_time: '2024-09-30 23:59:59'
  },
  {
    id: 4,
    username: 'test004',
    code: 'WXYZ-ABCD-EFGH-IJKL',
    ip: '192.168.1.103',
    location: '广东省广州市',
    login_time: '2024-03-15 07:00:00',
    heart_time: '2024-03-15 07:05:00',
    device: 'Windows 10 Pro x64',
    md5: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',
    expire_time: '2024-03-14 23:59:59'
  },
  {
    id: 5,
    username: 'test005',
    code: 'MNOP-QRST-UVWX-YZAB',
    ip: '192.168.1.104',
    location: '浙江省杭州市',
    login_time: '2024-03-15 06:50:45',
    heart_time: '2024-03-15 06:55:45',
    device: 'Windows 11 Pro x64',
    md5: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    expire_time: '2025-03-15 23:59:59'
  }
])

// 自定义加载图标
const loadingSvg = `
  <path class="path" d="
    M 30 15
    L 28 17
    M 25.61 25.61
    A 15 15, 0, 0, 1, 15 30
    A 15 15, 0, 1, 1, 27.99 7.5
    L 15 15
  " style="stroke-width: 4px; fill: none;"/>
`

// 获取在线用户列表
const fetchOnlineList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/online/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        search: searchKeyword.value || undefined
      }
    })

    if (res.status === 0) {
      // 模拟数据
      tableData.value = res.data.online
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取在线用户列表失败')
    }
  } catch (error) {
    console.error('获取在线用户列表错误:', error)
    ElMessage.error('获取在线用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleKickout = (row) => {
  ElMessageBox.confirm(
    '确定要将该用户踢下线吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/online',
        method: 'post',
        data: {
          edit: 3,
          id: row.id
        }
      })

      if (res.status === 0) {
        ElMessage.success('操作成功')
        fetchOnlineList()
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    } catch (error) {
      console.error('踢下线错误:', error)
      ElMessage.error('操作失败')
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchOnlineList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOnlineList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOnlineList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'login_time') {
    sortLogin.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
    sortHeart.value = null
  } else if (prop === 'heart_time') {
    sortHeart.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
    sortLogin.value = null
  }
  fetchOnlineList()
}

// 捕获截图
const handleCapture = async (row) => {
  ElMessageBox.confirm(
    '确定要捕获该用户的屏幕截图吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/online',
        method: 'post',
        data: {
          edit: 1,
          id: row.id
        }
      })

      if (res.status === 0) {
        ElMessage.success('已发送截图请求')
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    } catch (error) {
      console.error('捕获截图错误:', error)
      ElMessage.error('操作失败')
    }
  })
}

// 发送消息
const handleMessage = (row) => {
  ElMessageBox.prompt(
    '请输入要发送的消息',
    '发送消息',
    {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入消息内容'
    }
  ).then(async ({ value }) => {
    if (!value) {
      ElMessage.warning('消息内容不能为空')
      return
    }

    try {
      const res = await request({
        url: '/admin/online',
        method: 'post',
        data: {
          edit: 2,
          id: row.id,
          content: value
        }
      })

      if (res.status === 0) {
        ElMessage.success('消息已发送')
      } else {
        ElMessage.error(res.msg || '发送失败')
      }
    } catch (error) {
      console.error('发送消息错误:', error)
      ElMessage.error('发送失败')
    }
  })
}

// 刷新列表
const handleRefresh = () => {
  fetchOnlineList()
  ElMessage.success('刷新成功')
}

// 发送全局消息
const handleBroadcast = () => {
  ElMessageBox.prompt(
    '请输入要发送给所有在线用户的消息',
    '发送全局消息',
    {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入消息内容'
    }
  ).then(async ({ value }) => {
    if (!value) {
      ElMessage.warning('消息内容不能为空')
      return
    }

    try {
      const res = await request({
        url: '/admin/online',
        method: 'post',
        data: {
          edit: 4,
          content: value
        }
      })

      if (res.status === 0) {
        ElMessage.success('消息已发送')
      } else {
        ElMessage.error(res.msg || '发送失败')
      }
    } catch (error) {
      console.error('发送全局消息错误:', error)
      ElMessage.error('发送失败')
    }
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchOnlineList()
})
</script>

<style scoped>
.online-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left {
  display: flex;
  gap: 10px;
}

.right {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 自定义加载样式 */
:deep(.el-loading-spinner) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;

  .el-loading-text {
    color: var(--el-color-primary);
    font-size: 14px;
    letter-spacing: 1px;
  }

  svg {
    width: 50px;
    height: 50px;
    margin: 0;
  }

  .path {
    stroke: var(--el-color-primary);
    stroke-linecap: round;
    animation: loading-dash 1.5s ease-in-out infinite;
  }
}

@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }

  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 加载遮罩层样式 */
:deep(.el-loading-mask) {
  backdrop-filter: blur(1px);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>