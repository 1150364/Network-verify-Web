<template>
  <div class="scores-container">
    <el-card v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)"
      :element-loading-svg="loadingSvg" element-loading-svg-view-box="-10, -10, 50, 50">
      <template #header>
        <div class="header">
          <div class="left">
            <!-- 预留左侧空间，如果以后需要添加按钮 -->
          </div>
          <div class="right">
            <el-input v-model="searchKeyword" placeholder="曲谱名/用户名" style="width: 200px" clearable
              @clear="handleSearch" />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange" v-loading="loading"
        :default-sort="{ prop: 'createTime', order: 'descending' }">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="上传用户" width="300" />
        <el-table-column prop="name" label="曲谱名" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="file-info">
              <el-icon>
                <Document />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <template v-if="userStore.userType == '管理员'">
          <el-table-column prop="ip" label="IP" width="160" />
          <el-table-column prop="location" label="地理位置" width="180" show-overflow-tooltip />
        </template>
        <el-table-column prop="createTime" label="发布时间" width="180" sortable="custom" align="center" />
        <el-table-column prop="downloads" label="下载次数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDownloadType(row.downloads)">{{ row.downloads }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
            <el-button type="danger"  v-if="userStore.userType === '管理员'" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      width="800px"
      :title="previewData.name"
      destroy-on-close
    >
      <div 
        class="preview-content" 
        v-loading="previewLoading"
        element-loading-text="加载中..."
      >
        <pre v-if="previewContent">{{ previewContent }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const previewVisible = ref(false)
const previewData = reactive({
  name: '',
  content: ''
})
const previewContent = ref('')
const previewLoading = ref(false)
const loading = ref(false)
const sortCreate = ref(1)  // 创建时间排序，默认倒序
const tableData = ref([])  // 初始化 tableData

// 获取曲谱列表
const fetchScoreList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/scores/list',
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
        location: file.address,
        createTime: file.create_time,
        downloads: file.download
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取曲谱列表失败')
    }
  } catch (error) {
    console.error('获取曲谱列表错误:', error)
    ElMessage.error('获取曲谱列表失败')
  } finally {
    loading.value = false
  }
}

const handlePreview = async (row) => {
  previewLoading.value = true
  previewData.name = row.name
  previewVisible.value = true
  
  try {
    const res = await request({
      url: `/admin/file/scores/${row.id}`,
      method: 'get',
      responseType: 'text',
      transformResponse: [(data) => data]
    })
   
    
    previewContent.value = res.data || '暂无内容'
  } catch (error) {
    console.error('获取曲谱内容错误:', error)
    ElMessage.error('获取曲谱内容失败')
  } finally {
    previewLoading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该曲谱吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
      try {
        const res = await request({
          url: '/admin/file',
          method: 'delete',
          data: {
            id: row.id
          }
        })

        if (res.status === 0) {
          ElMessage.success('删除成功')
          fetchScoreList()
        } else {
          ElMessage.error(res.msg || '删除失败')
        }
      } catch (error) {
        console.error('删除曲谱错误:', error)
        ElMessage.error('删除失败')
      }
    })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchScoreList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchScoreList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchScoreList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchScoreList()
}

const getDownloadType = (downloads) => {
  if (downloads >= 100) return 'danger'
  if (downloads >= 50) return 'warning'
  if (downloads >= 10) return 'success'
  return 'info'
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

// 页面加载时获取数据
onMounted(() => {
  fetchScoreList()
})
</script>

<style scoped>
.scores-container {
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

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
  min-height: 200px;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: Monaco, Menlo, Consolas, "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
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