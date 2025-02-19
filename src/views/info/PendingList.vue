<template>
  <div class="pending-container">
    <el-card 
      v-loading="loading" 
      element-loading-text="加载中..." 
      element-loading-background="rgba(255, 255, 255, 0.9)"
      :element-loading-svg="loadingSvg"
      element-loading-svg-view-box="-10, -10, 50, 50"
    >
      <template #header>
        <div class="header">
          <div class="right">
            <el-select 
              v-model="searchType" 
              placeholder="类型" 
              clearable 
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="求生者" :value="1" />
              <el-option label="监管者" :value="2" />
              <el-option label="道具" :value="3" />
            </el-select>
            <el-select 
              v-model="searchOpType" 
              placeholder="操作类型" 
              clearable 
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="增加" :value="1" />
              <el-option label="删除" :value="2" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="名字/代码/用户名"
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
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名字" width="150" />
        <el-table-column prop="code" label="代码" show-overflow-tooltip />
        <el-table-column prop="username" label="提交用户" width="300" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="opType" label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getOpTypeTag(row.opType)">
              {{ getOpTypeText(row.opType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" sortable="custom" align="center"/>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

const searchKeyword = ref('')
const searchType = ref('')
const searchOpType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const sortCreate = ref(null)  // 排序，默认不排序
const tableData = ref([])  // 初始化 tableData

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

// 获取待审核列表
const fetchPendingList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/pending/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        create: sortCreate.value || undefined,
        type: searchType.value || undefined,
        operate: searchOpType.value || undefined,
        search: searchKeyword.value || undefined
      }
    })
    
    if (res.status === 0) {
      tableData.value = res.data.pending.map(item => ({
        ...item,
        type: item.type === '监管者' ? 2 : (item.type === '求生者' ? 1 : 3),
        opType: item.operate === '删除' ? 2 : 1,
        createTime: item.create_time
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取待审核列表失败')
    }
  } catch (error) {
    console.error('获取待审核列表错误:', error)
    ElMessage.error('获取待审核列表失败')
  } finally {
    loading.value = false
  }
}

const getTypeTag = (type) => {
  const types = {
    1: 'success',  // 求生者
    2: 'danger',   // 监管者
    3: 'warning'   // 道具
  }
  return types[type] || 'info'
}

const getTypeText = (type) => {
  const texts = {
    1: '求生者',
    2: '监管者',
    3: '道具'
  }
  return texts[type] || '未知'
}

const getOpTypeTag = (opType) => {
  const types = {
    1: 'success',  // 增加
    2: 'danger'    // 删除
  }
  return types[opType] || 'info'
}

const getOpTypeText = (opType) => {
  const texts = {
    1: '增加',
    2: '删除'
  }
  return texts[opType] || '未知'
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/pending',
        method: 'delete',
        data: {
          id: row.id
        }
      })
      
      if (res.status === 0) {
        ElMessage.success('删除成功')
        // 重新加载列表
        fetchPendingList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除待审核数据错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPendingList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchPendingList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchPendingList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchPendingList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchPendingList()
})
</script>

<style scoped>
.pending-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: flex-end;
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