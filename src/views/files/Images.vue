<template>
  <div class="images-container">
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
            <!-- 预留左侧空间，如果以后需要添加按钮 -->
          </div>
          <div class="right">
            <el-input
              v-model="searchKeyword"
              placeholder="用户名/文件名"
              style="width: 200px"
              clearable
              @clear="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange" v-loading="loading" :default-sort="{ prop: 'createTime', order: 'descending' }" :highlight-current-row="false">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="上传用户" width="300" />
        <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="file-info">
              <el-image
                :src="'/admin/file/picture/' + row.id"
                fit="cover"
                class="file-thumbnail"
                preview-teleported
                :preview-src-list="['/admin/file/picture/' + row.id]"
                @click.stop
                :ref="el => previewRefs[row.id] = el"
              />
              <span>{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="160" />
        <el-table-column prop="location" label="地理位置" width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" sortable="custom" align="center"/>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              @click="handlePreview(row)"
            >
              预览
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const sortCreate = ref(1)  // 创建时间排序，默认序
const tableData = ref([])  // 初始化 tableData

const previewRefs = {}

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

// 获取图片列表
const fetchImageList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/images/list',
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
        filename: file.name,
        location: file.address,
        createTime: file.create_time,
        url: file.url || ''  // 确保 url 字段存在，即使为空
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取图片列表失败')
    }
  } catch (error) {
    console.error('获取图片列表错误:', error)
    ElMessage.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该图片吗？',
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
        fetchImageList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除图片错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSearch = () => {
  // 实现搜索逻辑
  currentPage.value = 1
  fetchImageList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchImageList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchImageList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchImageList()
}

const handlePreviewError = () => {
  previewLoading.value = false
  ElMessage.error('图片加载失败')
}

const handlePreview = (row) => {
  const previewComponent = previewRefs[row.id]
  if (previewComponent) {
    previewComponent.$el.querySelector('img').click()
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchImageList()
})
</script>

<style scoped>
.images-container {
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

.file-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
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

/* 遮罩层样式 */
:deep(.el-loading-mask) {
  backdrop-filter: blur(1px);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整图片预览遮罩层的层级 */
:deep(.el-image-viewer__mask) {
  z-index: 3000;
}

:deep(.el-image-viewer__wrapper) {
  z-index: 3010;
}

/* 调整预览图片的操作按钮层级 */
:deep(.el-image-viewer__btn) {
  z-index: 3010;
}

:deep(.el-image-viewer__actions) {
  z-index: 3010;
}

/* 确保表格的固定列不会超过预览层 */
:deep(.el-table__fixed) {
  z-index: 10;
}

:deep(.el-table__fixed-right) {
  z-index: 10;
}

/* 隐藏预览按钮的错误占位符 */
.image-slot {
  display: none;
}
</style> 