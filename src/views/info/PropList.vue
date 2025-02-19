<template>
  <div class="props-container">
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
            <el-button type="primary" @click="handleAdd">新增道具</el-button>
          </div>
          <div class="right">
            <el-input
              v-model="searchKeyword"
              placeholder="道具名/代码"
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
        :default-sort="{ prop: 'sort', order: 'ascending' }"
        element-loading-text="加���中..."
        element-loading-background="rgba(255, 255, 255, 0.9)"
        :element-loading-svg="loadingSvg"
        element-loading-svg-view-box="-10, -10, 50, 50"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名字" width="200" />
        <el-table-column prop="code" label="代码" min-width="200" />
        <el-table-column prop="sort" label="排序" width="100" sortable="custom" align="center" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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

    <!-- 表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="名字" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名字" />
        </el-form-item>
        <el-form-item label="代码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入代码" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="99999" style="width: 100%" />
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
import request from '../../utils/request'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增道具')
const formRef = ref(null)
const isAdd = ref(true)
const loading = ref(false)
const sortOrder = ref(2)  // 排序，默认升序:2
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

// 获取道具列表
const fetchPropList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/prop/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        sort: sortOrder.value,
        search: searchKeyword.value || undefined
      }
    })
    
    if (res.status === 0) {
      tableData.value = res.data.character.map(prop => ({
        ...prop
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取道具列表失败')
    }
  } catch (error) {
    console.error('获取道具列表错误:', error)
    ElMessage.error('获取道具列表失败')
  } finally {
    loading.value = false
  }
}

const formData = reactive({
  name: '',
  code: '',
  sort: '0'
})

const rules = {
  name: [
    { required: true, message: '请输入名字', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入代码', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
}

const handleAdd = () => {
  isAdd.value = true
  dialogTitle.value = '新增道具'
  Object.assign(formData, {
    name: '',
    code: '',
    sort: '0'
  })
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleEdit = (row) => {
  isAdd.value = false
  dialogTitle.value = '编辑道具'
  dialogVisible.value = true
  Object.assign(formData, row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该道具吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/props',
        method: 'delete',
        data: {
          id: row.id
        }
      })
      
      if (res.status === 0) {
        ElMessage.success('删除成功')
        fetchPropList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除道具错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPropList()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      if (isAdd.value) {
        addProp()
      } else {
        editProp()
      }
    }
  })
}

const addProp = async () => {
  try {
    const res = await request({
      url: '/admin/props',
      method: 'post',
      data: {
        name: formData.name,
        code: formData.code,
        sort: formData.sort
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      fetchPropList()
    } else {
      ElMessage.error(res.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加道具错误:', error)
    ElMessage.error('添加失败')
  }
}

const editProp = async () => {
  try {
    const res = await request({
      url: '/admin/props',
      method: 'put',
      data: {
        id: formData.id,
        name: formData.name,
        code: formData.code,
        sort: formData.sort
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('修改成功')
      dialogVisible.value = false
      fetchPropList()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改道具错误:', error)
    ElMessage.error('修改失败')
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchPropList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchPropList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'sort') {
    sortOrder.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchPropList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchPropList()
})
</script>

<style scoped>
.props-container {
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