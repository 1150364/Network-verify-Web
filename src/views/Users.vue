<template>
  <div class="users-container">
    <el-card 
      v-loading="loading" 
      element-loading-text="加载中..." 
      element-loading-background="rgba(255, 255, 255, 0.9)"
      :element-loading-svg="loadingSvg"
      element-loading-svg-view-box="-10, -10, 50, 50"
    >
      <template #header>
        <div class="header">
          <div class="left">
            <el-button 
              v-if="userStore.userType === '管理员'"
              type="primary" 
              @click="handleAdd"
            >
              新增用户
            </el-button>
          </div>
          <div class="right">
            <el-select 
              v-model="searchStatus" 
              placeholder="用户状态" 
              clearable 
              style="width: 120px"
              @change="handleStatusChange"
            >
              <el-option label="正常" :value="1" />
              <el-option label="封禁" :value="2" />
              <el-option 
                v-if="userStore.userType === '管理员'" 
                label="已删除" 
                :value="3" 
              />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="用户名/机器码"
              style="width: 200px"
              clearable
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange" v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)" :element-loading-svg="loadingSvg" element-loading-svg-view-box="-10, -10, 50, 50">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" min-width="300" />
        <el-table-column prop="machineCode" label="机器码" width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.code" placement="top" :show-after="500">
              <span>{{ row.code }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <template v-if="userStore.userType == '管理员'">
          <el-table-column prop="type" label="角色" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.type)">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
        </template>
        <el-table-column prop="expireTime" label="到期时间" width="170" sortable="custom" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="isExpired(row.expire_time) ? 'danger' : 'success'"
              effect="plain"
            >
              {{ row.expire_time }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" sortable="custom" align="center">
          <template #default="{ row }">
            {{ row.create_time }}
          </template>
        </el-table-column>
        <template v-if="userStore.userType === '管理员'">
          <el-table-column prop="customized" label="自定义配置" width="250" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip 
                :content="formatCustomized(row.customized)"
                placement="top" 
                :show-after="500"
              >
                <span>{{ formatCustomizedPreview(row.customized) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </template>
        <el-table-column prop="remark" label="备注" width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip 
              :content="row.remark || '-'"
              placement="top" 
              :show-after="500"
            >
              <span>{{ row.remark || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.state)">
              {{ getStatusText(row.state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="userStore.userType === '管理员' ? 360 : 300">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button 
                :type="row.state != 0 ? 'success' : 'danger'" 
                link 
                @click="handleToggleStatus(row)"
                :disabled="isCurrentUserRow(row)"
              >
                {{ row.state != 0 ? '启用' : '禁用' }}
              </el-button>
              <el-button type="warning" link @click="handleReset(row)">重置机器码</el-button>
              <el-button type="info" link @click="handleViewLog(row)">查看日志</el-button>
              <template v-if="userStore.userType == '管理员'">
                <el-button 
                  v-if="searchStatus != 3" 
                  type="danger" 
                  link 
                  @click="handleDelete(row)"
                  :disabled="isCurrentUserRow(row)"
                >
                  删除
                </el-button>
                <el-button 
                  v-else
                  type="success" 
                  link 
                  @click="handleRecover(row)"
                >
                  恢复
                </el-button>
              </template>
            </div>
            <div class="operation-dropdown">
              <el-dropdown trigger="click">
                <el-button link size="small" style="padding: 4px">
                  作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleEdit(row)">编辑</el-dropdown-item>
                    <el-dropdown-item 
                      :style="{ color: row.status === 0 ? 'var(--el-color-success)' : 'var(--el-color-danger)' }"
                      @click="handleToggleStatus(row)"
                    >
                      {{ row.status === 0 ? '启用' : '禁用' }}
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleReset(row)">重置机器码</el-dropdown-item>
                    <el-dropdown-item @click="handleViewLog(row)">查看日志</el-dropdown-item>
                    <template v-if="userStore.userType === '管理员'">
                      <el-dropdown-item
                        v-if="row.status !== 3"
                        :style="{ color: 'var(--el-color-danger)' }"
                        @click="handleDelete(row)"
                      >
                        删除
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-else
                        :style="{ color: 'var(--el-color-success)' }"
                        @click="handleRecover(row)"
                      >
                        恢复
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @closed="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="formData.username" 
            placeholder="请输入用户名" 
            :disabled="!isAdd && userStore.userType !== '管理员'"
          />
        </el-form-item>
        <el-form-item 
          label="密码" 
          prop="password" 
        >
          <template v-if="isAdd || showResetPassword">
            <el-input 
              v-model="formData.password" 
              type="password" 
              placeholder="请输入密码"
            />
          </template>
          <template v-else>
            <el-button 
              type="primary" 
              link 
              @click="handleShowResetPassword"
            >
              重置密码
            </el-button>
          </template>
        </el-form-item>
        <template v-if="userStore.userType === '管理员'">
          <el-form-item label="角色" prop="type">
            <el-select 
              v-model="formData.type" 
              placeholder="请选择角色"
              :disabled="!isAdd && formData.type === '管理员'"
            >
              <el-option label="代理" value="代理" />
              <el-option label="用户" value="用户" />
            </el-select>
          </el-form-item>
          <el-form-item label="期时间" prop="expireTime">
            <el-date-picker
              v-model="formData.expireTime"
              type="datetime"
              placeholder="请选择到期时间"
              style="width: 100%"
              value-format="YYYY-MM-DD HH:mm:ss"
              clearable
            />
          </el-form-item>
          <el-form-item label="自定义配置" prop="customized">
            <el-input
              v-model="formData.customized"
              type="textarea"
              :rows="4"
              placeholder="请输入自定义配置（JSON格式）"
            />
            <div class="config-tip">
              <el-alert
                title="配置示例：{'maxDevices': 3, 'allowShare': true}"
                type="info"
                :closable="false"
              />
            </div>
          </el-form-item>
        </template>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        <el-form-item label="状态" prop="state">
          <el-switch
            v-model="formData.state"
            active-value="0"
            inactive-value="1"
            active-text="启用"
            inactive-text="禁用"
            :disabled="isCurrentUser"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 日志对话框 -->
    <el-dialog
      title="操作日志"
      v-model="logDialogVisible"
      width="910px"
    >
      <div class="log-header">
        <div class="left">
          <el-select 
            v-model="logType" 
            placeholder="日志类型" 
            clearable 
            style="width: 120px"
            @change="handleLogFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="登录" value="1" />
            <el-option label="注册" value="2" />
            <el-option label="充值" value="3" />
            <el-option label="解绑" value="4" />
            <el-option label="修改密码" value="5" />
            <el-option label="心跳" value="6" />
            <el-option label="上传文件" value="7"  v-if="userStore.userType === '管理员'"/>
            <el-option label="下载文件" value="9"  v-if="userStore.userType === '管理员'"/>
            <el-option label="提交信息" value="8"  v-if="userStore.userType === '管理员'"/>
          </el-select>
          <el-date-picker
            v-model="logDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleLogFilterChange"
          />
        </div>
      </div>
      <el-table 
        :data="logData" 
        border 
        style="width: 100%"
        @sort-change="handleLogSortChange"
        :default-sort="{ prop: 'time', order: 'descending' }"
      >
        <el-table-column prop="type" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getLogTypeTag(row.type)">
              {{ getLogTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="操作内容" min-width="160" show-overflow-tooltip/>
        <el-table-column prop="machineCode" label="机器码" width="130" show-overflow-tooltip/>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="location" label="地理位置" width="170" show-overflow-tooltip />
        <el-table-column 
          prop="time" 
          label="操作时间" 
          width="170" 
          sortable="custom"
          :sort-orders="['ascending', 'descending']"
        />
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="logCurrentPage"
          v-model:page-size="logPageSize"
          :total="logTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleLogSizeChange"
          @current-change="handleLogCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const searchKeyword = ref('')
const searchStatus = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sortExpire = ref(null)  // 到期时间排序
const sortCreate = ref(null)  // 创建时间排序

// 表格数据
const tableData = ref([])

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/user/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        state: searchStatus.value,
        expire: sortExpire.value,
        create: sortCreate.value,
        search: searchKeyword.value || undefined
      }
    })
    
    if (res.status === 0) {
      tableData.value = res.data.user.map(user => ({
        ...user
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取用户列表失败')
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 加状态变化处理函数
const handleStatusChange = () => {
  currentPage.value = 1  // 重置页码
  fetchUserList()        // 新获取数据
}

// 使用相同的处理函数
const handleSearch = handleStatusChange

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchUserList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchUserList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'expireTime') {
    sortExpire.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
    sortCreate.value = null
  } else if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
    sortExpire.value = null
  }
  fetchUserList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchUserList()
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const isAdd = ref(true)
const showResetPassword = ref(false)

const formData = reactive({
  username: '',
  password: '',
  expireTime: '',
  customized: '{}',
  remark: '',
  state: '0',
  type: '用户'  // 默认为代理角色
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, message: '用户名不能少于4个字符', trigger: 'blur' }
  ],
  password: [{ 
    trigger: 'blur',
    required: true,
    validator: (rule, value, callback) => {
      if (isAdd.value || showResetPassword.value) {
        if (!value) {
          callback(new Error('请输入密码'))
          return
        }
        if (value.length < 4) {
          callback(new Error('密码不能少于4个字符'))
          return
        }
      } else {
        if (value && value.length < 4) {
          callback(new Error('密码不能少于4个字符'))
          return
        }
      }
      callback()
    }
  }],
  type: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  customized: [
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        try {
          JSON.parse(value)
          callback()
        } catch (error) {
          callback(new Error('请输入有效的JSON格式'))
        }
      }, 
      trigger: 'blur'
    }
  ]
}

const getStatusType = (status) => {
  const types = {
    0: 'success',  // 正常
    1: 'danger',   // 封禁
    2: 'danger',   // 封禁
    3: 'info'      // 已删除
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    0: '正常',
    1: '封禁',
    2: '封禁',
    3: '已删除'
  }
  return texts[status] || '未知'
}

const isExpired = (expireTime) => {
  if (!expireTime) return false
  return new Date(expireTime) < new Date()
}

const handleAdd = () => {
  isAdd.value = true
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
    formRef.value.clearValidate()
  }
  Object.assign(formData, {
    username: '',
    password: '',
    type: '用户',
    expireTime: '',
    customized: '{}',
    state: '0',
    remark: ''
  })
}

const handleEdit = (row) => {
  isAdd.value = false
  showResetPassword.value = false
  dialogTitle.value = '编辑用户'
  dialogVisible.value = true
  currentRow.value = row
  if (formRef.value) {
    formRef.value.resetFields()
    formRef.value.clearValidate()
  }
  Object.assign(formData, {
    ...row,
    password: '',
    expireTime: row.expire_time,
    // 如果是代理，不设置这些字段
    ...(userStore.userType !== '管理员' ? {
      expireTime: undefined,
      customized: undefined,
      type: undefined,
    } : {})
  })
}

const handleToggleStatus = (row) => {
  const action = row.state === '0' ? '禁用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}该用户吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    currentRow.value = row
    // 根据当前状态决定是禁用还是启用
    await editUser(row.state === '0' ? 2 : 3)
  })
}

const handleReset = (row) => {
  ElMessageBox.confirm(
    '重置机器码后，用户需要重新绑定设备，是否继续',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    currentRow.value = row
    await editUser(4)  // 重置机器码
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      if (isAdd.value) {
        addUser()
      } else {
        editUser(1)  // 编辑用户对话框
      }
    }
  })
}

const addUser = async () => {
  try {
    const res = await request({
      url: '/admin/user',
      method: 'post',
      data: {
        username: formData.username,
        password: formData.password,
        type: formData.type,
        expire_time: formData.expireTime,
        customized: formData.customized,
        state: formData.state,  // 转换状态值
        remark: formData.remark
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      fetchUserList()
    } else {
      ElMessage.error(res.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加用户错误:', error)
    ElMessage.error('添加失败')
  }
}

const handleViewLog = (row) => {
  logDialogVisible.value = true
  currentRow.value = row
  logCurrentPage.value = 1
  fetchLogList()
}

const handleSearchLog = () => {
  logCurrentPage.value = 1
  fetchLogList()
}

const handleExportLog = () => {
  // 实现导出日志功能
  ElMessage.success('日志导出成功')
}

const handleLogSizeChange = (val) => {
  logPageSize.value = val
  fetchLogList()
}

const handleLogCurrentChange = (val) => {
  logCurrentPage.value = val
  fetchLogList()
}

const handleShowResetPassword = () => {
  showResetPassword.value = true
  formData.password = ''
}

// 日志相关的响应式变量
const logDialogVisible = ref(false)
const logType = ref('')
const logDateRange = ref([])
const logCurrentPage = ref(1)
const logPageSize = ref(10)
const logTotal = ref(0)
const logData = ref([])

// 日志类型相关函数
const getLogTypeTag = (type) => {
  const types = {
    login: 'success',
    register: 'primary',
    recharge: 'warning',
    unbind: 'danger',
    changePassword: 'info',
    heartbeat: 'warning',
    upload: 'success',
    submit: 'primary',
    download: 'success'
  }
  return types[type] || 'info'
}

const getLogTypeText = (type) => {
  const texts = {
    login: '登录',
    register: '注册',
    recharge: '充值',
    unbind: '解绑',
    changePassword: '修改密码',
    heartbeat: '心跳',
    upload: '上传文件',
    submit: '提交信息',
    download: '下载文件'
  }
  return texts[type] || '未知'
}



const loading = ref(false)

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '删除后用户将无法登录，是否继续？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 调用删除接口
    currentRow.value = row
    await editUser(6) // 删除用户
  })
}


// 恢复用户
const handleRecover = (row) => {
  ElMessageBox.confirm(
    '恢复后用户将可以正常使用，是否继续？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 调用恢复接口
    currentRow.value = row
    await editUser(5) // 恢复用户
  })
}

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

const getRoleType = (type) => {
  const types = {
    '管理员': 'danger',
    '代理': 'warning'
  }
  return types[type] || 'info'
}

// 编辑用户
const editUser = async (editType) => {
  try {
    const res = await request({
      url: '/admin/user',
      method: 'put',
      data: {
        id: currentRow.value.id,
        edit: editType,
        username: editType == 1 ? formData.username : undefined,
        password: editType == 1 ? formData.password.length > 0 ? formData.password : undefined : undefined,
        type: editType == 1 ? formData.type : undefined ,
        expire_time: editType == 1 ? formData.expireTime : undefined,
        customized: editType == 1 ? formData.customized : undefined,
        state: editType == 1 ? formData.state : undefined,
        remark: editType == 1 ? formData.remark : undefined
      }
    })
    
    if (res.status === 0) {
      ElMessage.success(res.msg || '修改成功')
      dialogVisible.value = false
      fetchUserList()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改用户错误:', error)
    ElMessage.error('修改失败')
  }
}

// 添加当前编辑行的引用
const currentRow = ref(null)

// 在对话框关闭时清空当前行数据
const handleDialogClose = () => {
  currentRow.value = null
}

// 判断是否是当前用户
const isCurrentUser = computed(() => {
  return currentRow.value?.username === userStore.username
})

// 判断表格行是否是当前用户
const isCurrentUserRow = (row) => {
  return row.username === userStore.username
}

// 获取日志数据
const fetchLogList = async (sortValue = 1) => {
  try {
    const res = await request({
      url: '/admin/log/list',
      method: 'get',
      params: {
        id: currentRow.value.id,
        type: logType.value || undefined,
        create: sortValue,  // 1倒序，2升序
        start: logDateRange.value?.[0],
        end: logDateRange.value?.[1],
        page: logCurrentPage.value,
        num: logPageSize.value
      }
    })
    
    if (res.status === 0) {
      logData.value = res.data.log.map(log => ({
        type: getLogTypeByModule(log.module),
        content: log.message,
        machineCode: log.code,
        ip: log.ip,
        location: log.address,
        time: log.create_time
      }))
      logTotal.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取日志失败')
    }
  } catch (error) {
    console.error('获取日志错误:', error)
    ElMessage.error('获取日志失败')
  }
}

// 根据模块名获取日志类型
const getLogTypeByModule = (module) => {
  const types = {
    '登录': 'login',
    '注册': 'register',
    '重置': 'reset',
    '解绑': 'unbind',
    '充值': 'recharge',
    '修改密码': 'changePassword',
    '心跳包': 'heartbeat',
    '上传文件': 'upload',
    '提交信息': 'submit',
    '下载文件': 'download'
  }
  return types[module] || 'unknown'
}

// 日志筛选条件变化时重新请求数据
const handleLogFilterChange = () => {
  logCurrentPage.value = 1  // 重置页码
  fetchLogList()
}

// 处理日志表格排序
const handleLogSortChange = ({ prop, order }) => {
  if (prop === 'time') {
    // create: 1 倒序，2 升序
    const sortValue = order === 'descending' ? 1 : (order === 'ascending' ? 2 : 1)
    fetchLogList(sortValue)
  }
}

// 格式化自定义配置
const formatCustomized = (customized) => {
  if (!customized) return '-'
  try {
    return JSON.stringify(JSON.parse(customized), null, 2)
  } catch (e) {
    return customized
  }
}

// 格式化自定义配置预览
const formatCustomizedPreview = (customized) => {
  if (!customized) return '-'
  try {
    const obj = JSON.parse(customized)
    return JSON.stringify(obj)
  } catch (e) {
    return customized
  }
}
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.log-header .left {
  display: flex;
  gap: 10px;
}

.log-header .right {
  display: flex;
  gap: 10px;
}

.config-tip {
  margin-top: 5px;
}

.config-tip :deep(.el-alert) {
  padding: 5px 10px;
}

.config-tip :deep(.el-alert__title) {
  font-size: 12px;
  line-height: 1.2;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.operation-dropdown {
  display: none;
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

/* 调整操作列宽度以适应更多按钮 */
:deep(.el-table .el-table__cell:last-child) {
  min-width: 400px;
}
</style> 