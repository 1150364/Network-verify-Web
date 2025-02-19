<template>
  <div class="characters-container">
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
            <el-button type="primary" @click="handleAdd">新增人物</el-button>
          </div>
          <div class="right">
            <el-select 
              v-model="searchCamp" 
              placeholder="阵营" 
              clearable 
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="求生者" :value="1" />
              <el-option label="监管者" :value="2" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="人物名/代码"
              style="width: 200px"
              clearable
              @clear="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange" v-loading="loading" :default-sort="{ prop: 'sort', order: 'ascending' }">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名字" width="200" />
        <el-table-column prop="code" label="代码" />
        <el-table-column prop="camp" label="阵营" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getCampType(row.camp)">
              {{ getCampText(row.camp) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isEqual" label="是否等于" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="row.required == 0 ? 'success' : 'info'">
              {{ row.required == 0 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-form-item label="阵营" prop="camp">
          <el-select v-model="formData.camp" placeholder="请选择阵营" style="width: 100%">
            <el-option label="求生者" value="0" />
            <el-option label="监管者" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否等于" prop="isEqual">
          <el-switch
            v-model="formData.required"
            active-value="0"
            inactive-value="1"
            active-text="是"
            inactive-text="否"
          />
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
const searchCamp = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增人物')
const formRef = ref(null)
const isAdd = ref(true)
const loading = ref(false)
const sortOrder = ref(2)  // 排序，默认升序:2
const tableData = ref([])  // 初始化 tableData

// 自定义加载图
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

// 获取人物列表
const fetchCharacterList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/characters/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        sort: sortOrder.value,
        camp: searchCamp.value,
        search: searchKeyword.value || undefined
      }
    })
    
    if (res.status === 0) {
      tableData.value = res.data.character.map(char => ({
        ...char
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取人物列表失败')
    }
  } catch (error) {
    console.error('获取人物列表错误:', error)
    ElMessage.error('获取人物列表失败')
  } finally {
    loading.value = false
  }
}

const formData = reactive({
  name: '',
  code: '',
  camp: '1',
  required: '1',
  sort: '0'
})

const rules = {
  name: [
    { required: true, message: '请输入名字', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入代码', trigger: 'blur' }
  ],
  camp: [
    { required: true, message: '请选择阵营', trigger: 'change' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
}

const getCampType = (camp) => {
  const types = {
    0: 'success',  // 求生者
    1: 'danger'    // 监管者
  }
  return types[camp] || 'info'
}

const getCampText = (camp) => {
  const texts = {
    0: '求生者',
    1: '监管者'
  }
  return texts[camp] || '未知'
}

const handleAdd = () => {
  isAdd.value = true
  dialogTitle.value = '新增人物'
  Object.assign(formData, {
    name: '',
    code: '',
    camp: '1',
    required: '1',
    sort: '0'
  })
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleEdit = (row) => {
  isAdd.value = false
  dialogTitle.value = '编辑人物'
  dialogVisible.value = true
  Object.assign(formData, row)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该人物吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request({
        url: '/admin/characters',
        method: 'delete',
        data: {
          id: row.id
        }
      })
      
      if (res.status === 0) {
        ElMessage.success('删除成功')
        fetchCharacterList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除人物错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchCharacterList()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      if (isAdd.value) {
        addCharacter()
      } else {
        editCharacter()
      }
    }
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchCharacterList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCharacterList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'sort') {
    sortOrder.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
  }
  fetchCharacterList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchCharacterList()
})

// 添加人物
const addCharacter = async () => {
  try {
    const res = await request({
      url: '/admin/characters',
      method: 'post',
      data: {
        name: formData.name,
        code: formData.code,
        sort: formData.sort,
        camp: formData.camp,
        required: formData.required
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      fetchCharacterList()
    } else {
      ElMessage.error(res.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加人物错误:', error)
    ElMessage.error('添加失败')
  }
}

// 修改人物
const editCharacter = async () => {
  try {
    const res = await request({
      url: '/admin/characters',
      method: 'put',
      data: {
        id: formData.id,
        name: formData.name,
        code: formData.code,
        sort: formData.sort,
        camp: formData.camp,
        required: formData.required
      }
    })
    
    if (res.status === 0) {
      ElMessage.success('修改成功')
      dialogVisible.value = false
      fetchCharacterList()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改人物错误:', error)
    ElMessage.error('修改失败')
  }
}
</script>

<style scoped>
.characters-container {
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