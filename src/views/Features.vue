<template>
  <div class="features-container">
    <el-card v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)"
      :element-loading-svg="loadingSvg" element-loading-svg-view-box="-10, -10, 50, 50">
      <template #header>
        <div class="header">
          <div class="left">
            <el-button type="primary" @click="handleAdd">新增特征码</el-button>
          </div>
          <div class="right">
            <el-input v-model="searchKeyword" placeholder="特征码/备注" style="width: 200px" clearable @clear="handleSearch" />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="类型" width="80" />
        <el-table-column prop="features" label="特征码" width="400" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.features" placement="top" :show-after="500">
              <span>{{ row.features|| '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="deviation" label="偏移量" width="80" align="center" />
        <el-table-column prop="length" label="长度" width="80" align="center" />
        <el-table-column prop="address" label="写入地址" width="100" align="center" />
        <el-table-column prop="code" label="汇编代码" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.code || '-'" placement="top" :show-after="500">
              <span>{{ row.code || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 表单对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="类型" prop="name">
          <el-input v-model="formData.name" placeholder="请输入类型" />
        </el-form-item>
        <el-form-item label="特征码" prop="features">
          <el-input
            v-model="formData.features"
            type="textarea"
            :rows="3"
            placeholder="请输入特征码"
          />
        </el-form-item>
        <el-form-item label="偏移量" prop="deviation">
          <el-input v-model="formData.deviation" placeholder="请输入偏移量" />
        </el-form-item>
        <el-form-item label="长度" prop="length">
          <el-input v-model="formData.length" placeholder="请输入长度" />
        </el-form-item>
        <el-form-item label="写入地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入写入地址" />
        </el-form-item>
        <el-form-item label="汇编代码" prop="code">
          <el-input
            v-model="formData.code"
            type="textarea"
            :rows="3"
            placeholder="请输入汇编代码"
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增特征码')
const formRef = ref(null)
const isAdd = ref(true)
const loading = ref(false)
const sortCreate = ref(1)  // 创建时间排序，默认倒序
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

// 获取特征码列表
const fetchFeatureList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/features/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        search: searchKeyword.value || undefined
      }
    })
    
    if (res.status == 0) {
      tableData.value = res.data.features
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取特征码列表失败')
    }
  } catch (error) {
    console.error('获取特征码列表错误:', error)
    ElMessage.error('获取特征码列表失败')
  } finally {
    loading.value = false
  }
}

const formData = reactive({
  name: '',
  features: '',
  deviation: '',
  length: '',
  address: '',
  code: ''
})

const rules = {
  name: [
    { required: true, message: '请输入类型', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入写入地址', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入汇编代码', trigger: 'blur' }
  ]
}

const handleAdd = () => {
  isAdd.value = true
  dialogTitle.value = '新增特征码'
  Object.assign(formData, {
    name: '',
    features: '',
    deviation: '',
    length: '',
    address: '',
    code: ''
  })
  dialogVisible.value = true
  nextTick(() => {
    if (formRef.value) {
      formRef.value.resetFields()
    }
  })
}

const handleEdit = (row) => {
  isAdd.value = false
  dialogTitle.value = '编辑特征码'
  dialogVisible.value = true
  Object.assign(formData, row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该特征码吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/features',
        method: 'delete',
        data: {
          id: row.id
        }
      })
      
      if (res.status == 0) {
        ElMessage.success('删除成功')
        fetchFeatureList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除特征码错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await request({
          url: '/admin/features',
          method: isAdd.value ? 'post' : 'put',
          data: {
            ...formData,
            id: isAdd.value ? undefined : formData.id
          }
        })
        
        if (res.status === 0) {
          ElMessage.success(isAdd.value ? '添加成功' : '修改成功')
          dialogVisible.value = false
          fetchFeatureList()
        } else {
          ElMessage.error(res.msg || (isAdd.value ? '添加失败' : '修改失败'))
        }
      } catch (error) {
        console.error('提交特征码错误:', error)
        ElMessage.error(isAdd.value ? '添加失败' : '修改失败')
      }
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchFeatureList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchFeatureList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchFeatureList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchFeatureList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchFeatureList()
})
</script>

<style scoped>
.features-container {
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

/* 隐藏文本域滚动条 */
:deep(.el-textarea__inner) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}
</style> 