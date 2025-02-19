<template>
  <div class="versions-container">
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
              新增版本
            </el-button>
          </div>
          <div class="right">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入MD5搜索"
              style="width: 200px"
              clearable
              @clear="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="tableData" 
        border 
        style="width: 100%" 
        @sort-change="handleSortChange" 
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-background="rgba(255, 255, 255, 0.9)"
        :element-loading-svg="loadingSvg"
        element-loading-svg-view-box="-10, -10, 50, 50"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="md5" label="文件MD5" width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.md5" placement="top" :show-after="500">
              <span>{{ row.md5 }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="downloadUrl" label="下载链接" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :href="row.downloadUrl" target="_blank">
              {{ row.downloadUrl }}
            </el-link>
          </template>
        </el-table-column>
       
        <el-table-column prop="content" label="更新内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.content" placement="top" :show-after="500">
              <span>{{ row.content }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="180" sortable="custom"  align="center"/>
        <el-table-column prop="forced" label="强制更新" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.forced == 0 ? 'danger' : 'info'">
              {{ row.forced == 0 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              v-if="userStore.userType === '管理员'"
              type="danger" 
              link 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
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

    <!-- 版本表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="文件MD5" prop="md5">
          <el-input 
            v-model="formData.md5" 
            placeholder="请输入文件MD5" 
            :disabled="!isAdd && userStore.userType !== '管理员'"
          />
        </el-form-item>
        <el-form-item label="下载链接" prop="downloadUrl">
          <el-input v-model="formData.downloadUrl" placeholder="请输入下载链接" />
        </el-form-item>
        <el-form-item label="强制更新" prop="forced">
          <el-switch
            v-model="formData.forced"
            active-value="0"
            inactive-value="1"
            active-text="是"
            inactive-text="否"
            :disabled="!isAdd && userStore.userType !== '管理员'"
          />
        </el-form-item>
        <el-form-item label="更新内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="4"
            placeholder="请输入更新内容"
            :disabled="!isAdd && userStore.userType !== '管理员'"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/user'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增版本')
const formRef = ref(null)
const isAdd = ref(true)
const loading = ref(false)
const sortCreate = ref(1)  // 创建时间排序，默认倒序

// 模拟数据
const tableData = ref()

const formData = reactive({
  md5: '',
  downloadUrl: '',
  forced: '0',
  content: ''
})

const rules = {
  md5: [
    { required: true, message: '请输入文件MD5', trigger: 'blur' }
  ],
  downloadUrl: [
    { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
  ],
  content: [
    { message: '请输入更新内容', trigger: 'blur' }
  ]
}

// 获取版本列表
const fetchVersionList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/version/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        create: sortCreate.value,
        search: searchKeyword.value || undefined
      }
    })
    
    if (res.status === 0) {
      tableData.value = res.data.file.map(file => ({
        ...file,
        downloadUrl: file.url,
        createTime: file.create_time
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取版本列表失败')
    }
  } catch (error) {
    ElMessage.error('获取版本列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isAdd.value = true
  dialogTitle.value = '新增版本'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    md5: '',
    downloadUrl: '',
    forced: '0',
    content: ''
  })
}

const handleEdit = (row) => {
  isAdd.value = false
  dialogTitle.value = '编辑版本'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
  currentRow.value = row
  Object.assign(formData, {
    md5: row.md5,
    downloadUrl: row.downloadUrl,
    forced: row.forced,
    content: row.content
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该版本吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/version',
        method: 'delete',
        data: {
          id: row.id
        }
      })
      
      if (res.status === 0) {
        ElMessage.success('删除成功')
        fetchVersionList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除版本错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchVersionList()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      if (isAdd.value) {
        addVersion()
      } else {
        editVersion()
      }
    }
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchVersionList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchVersionList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchVersionList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchVersionList()
})

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

// 添加版本
const addVersion = async () => {
  try {
    const res = await request({
      url: '/admin/version',
      method: 'post',
      data: {
        md5: formData.md5,
        url: formData.downloadUrl,
        content: formData.content,
        forced: formData.forced
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      fetchVersionList()
    } else {
      ElMessage.error(res.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加版本错误:', error)
    ElMessage.error('添加失败')
  }
}

// 修改版本
const editVersion = async () => {
  try {
    const res = await request({
      url: '/admin/version',
      method: 'put',
      data: {
        id: currentRow.value.id,
        md5: formData.md5,
        url: formData.downloadUrl,
        content: formData.content,
        forced: formData.forced
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('修改成功')
      dialogVisible.value = false
      fetchVersionList()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改版本错误:', error)
    ElMessage.error('修改失败')
  }
}

// 添加当前编辑行的引用
const currentRow = ref(null)

const userStore = useUserStore()
</script>

<style scoped>
.versions-container {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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