<template>
  <div class="cards-container">
    <el-card>
      <template #header>
        <div class="header">
          <div class="left">
            <el-button type="primary" @click="handleAdd">生成卡密</el-button>
          </div>
          <div class="right">
            <el-select v-model="searchType" placeholder="卡密类型" clearable style="width: 120px" @change="handleSearch">
              <el-option label="时卡" :value="1" v-if="userStore.userType == '管理员'" />
              <el-option label="天卡" :value="2" />
              <el-option label="周卡" :value="3" />
              <el-option label="月卡" :value="4" />
              <el-option label="季卡" :value="5" v-if="userStore.userType == '管理员'" />
              <el-option label="年卡" :value="6" v-if="userStore.userType == '管理员'" />
            </el-select>
            <el-select v-model="searchUseStatus" placeholder="使用状态" clearable style="width: 120px"
              @change="handleSearch">
              <el-option label="已使用" :value="1" />
              <el-option label="未使用" :value="0" />
            </el-select>
            <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px" @change="handleSearch">
              <el-option label="正常" :value="1" />
              <el-option label="禁用" :value="2" />
              <el-option label="已删除" :value="3" v-if="userStore.userType === '管理员'" />
            </el-select>
            <el-input v-model="searchKeyword" placeholder="卡号/使用人" style="width: 200px" clearable
              @clear="handleSearch" />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange" v-loading="loading"
        element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)"
        :element-loading-svg="loadingSvg" element-loading-svg-view-box="-10, -10, 50, 50"
        :default-sort="{ prop: 'createTime', order: 'descending' }">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="cardNo" label="卡号" min-width="310">
          <template #default="{ row }">
            <el-tooltip content="点击复制" placement="top">
              <span style="cursor: pointer; color: var(--el-color-primary);" @click="handleCopy(row.cardNo)">
                {{ row.cardNo }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="80" align="center">
          <template #default="{ row }">
            {{ row.duration }}
          </template>
        </el-table-column>
        <template v-if="userStore.userType === '管理员'">
          <el-table-column prop="creator" label="创建人" min-width="200" />
        </template>
        <el-table-column prop="user" label="使用人" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.user }}</span>
            <el-tag size="small" :type="row.useStatus == 1 ? 'success' : 'info'" style="margin-left: 5px">
              {{ getUseStatusText(row.useStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" sortable="custom" align="center" />
        <el-table-column prop="useTime" label="使用时间" width="180" sortable="custom" align="center" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.remark || '-'" placement="top" :show-after="500">
              <span>{{ row.remark || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button :type="row.status == 0 ? 'danger' : 'success'" link @click="handleToggleStatus(row)">
              {{ row.status == 0 ? '禁用' : '启用' }}
            </el-button>
            <template v-if="searchStatus === 3">
              <el-button type="success" link @click="handleRecover(row)">恢复</el-button>
            </template>
            <template v-else>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 生成卡密对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <template v-if="!isAdd">
          <el-form-item label="卡号" prop="cardNo">
            <el-input v-model="formData.cardNo" :disabled="userStore.userType !== '管理员'" />
          </el-form-item>
        </template>
        <el-form-item label="卡密类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择卡密类型" style="width: 100%"
            :disabled="!isAdd && userStore.userType !== '管理员'">
            <el-option label="时卡" :value="1" v-if="userStore.userType === '管理员'" />
            <el-option label="天卡" :value="2" />
            <el-option label="周卡" :value="3" />
            <el-option label="月卡" :value="4" />
            <el-option label="季卡" :value="5" v-if="userStore.userType === '管理员'" />
            <el-option label="年卡" :value="6" v-if="userStore.userType === '管理员'" />
          </el-select>
        </el-form-item>
        <template v-if="userStore.userType === '管理员'">
          <el-form-item label="代理可见" prop="agentVisible">
            <el-select v-model="formData.agentVisible" placeholder="请选择可见代理" style="width: 100%"
              :disabled="userStore.userType !== '管理员'" clearable filterable>
              <el-option label="不可见" :value="0" />
              <el-option v-for="agent in agentList" :key="agent.id" :label="agent.username" :value="agent.id" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item label="时长" prop="duration">
          <el-input-number v-model="formData.duration" :min="1" :max="999" style="width: 100%"
            :disabled="!isAdd && userStore.userType !== '管理员'" />
        </el-form-item>



        <template v-if="isAdd">
          <el-form-item label="生成数量" prop="count">
            <el-input-number v-model="formData.count" :min="1" :max="100" style="width: 100%" />
          </el-form-item>
        </template>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" placeholder="请输入备注信息" type="textarea" :rows="3" />
        </el-form-item>

        <template v-if="!isAdd">
          <el-form-item label="状态" prop="status">
            <el-switch v-model="formData.status" active-value="0" inactive-value="1" active-text="正常"
              inactive-text="禁用" />
          </el-form-item>
        </template>

        <!-- 代理支付相关表单项 -->
        <template v-if="isAdd && userStore.userType === '代理'">
          <el-form-item label="支付方式" prop="payType">
            <el-radio-group v-model="formData.payType" class="payment-methods">
              <el-radio label="1">
                <div class="payment-method">
                  <img :src="qqpayIcon" class="payment-icon" />
                  <span>QQ支付</span>
                </div>
              </el-radio>
              <el-radio label="2">
                <div class="payment-method">
                  <img :src="wxpayIcon" class="payment-icon" />
                  <span>微信支付</span>
                </div>
              </el-radio>
              <el-radio label="3">
                <div class="payment-method">
                  <img :src="alipayIcon" class="payment-icon" />
                  <span>支付宝</span>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="应付金额">
            <div class="amount-wrapper">
              <div class="amount">
                <span class="currency">￥</span>
                <span class="number">{{ calculateAmount(formData.type, formData.count, formData.duration) }}</span>
              </div>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading" :disabled="submitLoading">
            {{ submitLoading ? '处理中...' : '确定' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import request from '../utils/request'
import qqpayIcon from '../assets/qqpay.png'
import wxpayIcon from '../assets/wxpay.png'
import alipayIcon from '../assets/alipay.png'

const searchKeyword = ref('')
const searchType = ref(null)
const searchStatus = ref(null)
const searchUseStatus = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const formRef = ref(null)
const dialogTitle = ref('生成卡密')
const isAdd = ref(true)
const sortExpire = ref(null)  // 使用时间排序
const sortCreate = ref(1)  // 创建时间排序，默认倒序
const loading = ref(false)
const userStore = useUserStore()

// 添加提交按钮的加载状态
const submitLoading = ref(false)

// 获取卡密列表
const fetchCardList = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/admin/card/list',
      method: 'get',
      params: {
        page: currentPage.value,
        num: pageSize.value,
        state: searchStatus.value,
        apply: searchUseStatus.value,
        type: searchType.value,
        expire: sortExpire.value,
        create: sortCreate.value,
        search: searchKeyword.value || undefined
      }
    })

    if (res.status === 0) {
      tableData.value = res.data.card.map(card => ({
        ...card,
        cardNo: card.card,
        useStatus: card.user_id ? 1 : 0,
        user: card.user_id,
        creator: card.admin_id,
        status: card.state,
        useTime: card.update_time,
        createTime: card.create_time
      }))
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获卡密列表失败')
    }
  } catch (error) {
    ElMessage.error('获取卡密列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchCardList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchCardList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCardList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (prop === 'useTime') {
    sortExpire.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
    sortCreate.value = null
  } else if (prop === 'createTime') {
    sortCreate.value = order === 'descending' ? 1 : (order === 'ascending' ? 2 : null)
    sortExpire.value = null
  }
  fetchCardList()
}

// 页面加载时获取数据
onMounted(() => {
  fetchCardList()

  if (userStore.userType === '管理员') {
    fetchAgentList()
  }
})

// 模拟数据
const tableData = ref([])

// 代理列表
const agentList = ref([])

// 获取代理列表
const fetchAgentList = async () => {
  try {
    const res = await request({
      url: '/admin/agent/list',
      method: 'get'
    })

    if (res.status === 0) {
      agentList.value = Array.isArray(res.data.agent) ? res.data.agent : [res.data.agent]
    } else {
      ElMessage.error(res.msg || '获取代理列表失败')
    }
  } catch (error) {
    console.error('获取代理列表错误:', error)
    ElMessage.error('获取代理列表失败')
  }
}

const formData = reactive({
  type: 4,
  count: 1,
  duration: 1,
  remark: '',
  cardNo: '',
  status: 0,
  agentVisible: 0,
  payType: ''  // 支付方式：qq, wechat, alipay
})

const rules = {
  type: [{ required: true, message: '请选择卡密类型', trigger: 'change' }],
  count: [{ required: true, message: '请输入生成数量', trigger: 'blur' }],
  payType: [{
    required: userStore.userType === '代理',
    message: '请选择支付方式',
    trigger: 'change'
  }],
  agentVisible: [{
    required: userStore.userType === '管理员',
    message: '请选择代理是否可见',
    trigger: 'change'
  }],
  duration: [
    {
      required: true,
      message: '请输入时长',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (formData.type === 4) {
          callback()
          return
        }
        if (!value) {
          callback(new Error('请输入时长'))
          return
        }
        callback()
      }
    }
  ]
}

const getTypeTag = (type) => {
  const types = {
    '时卡': 'info',        // 时卡
    '天卡': 'info',    // 天卡
    '周卡': 'warning', // 周卡
    '月卡': 'success', // 月卡
    '季卡': 'danger',  // 季
    '年卡': 'primary'  // 年卡
  }
  return types[type] || 'info'
}


const getTypeNum = (type) => {
  const types = {
    '时卡': 1,
    '天卡': 2,
    '周卡': 3,
    '月': 4,
    '季卡': 5,
    '年卡': 6
  }
  return types[type] || 4
}


const getStatusType = (status) => {
  const types = {
    0: 'success',  // 禁用
  }
  return types[status] || 'danger'
}

const getStatusText = (status) => {
  const texts = {
    0: '正常',
  }
  return texts[status] || '禁用'
}

const getUseStatusText = (useStatus) => {
  return useStatus === 1 ? '已使用' : '未使用'
}

const handleAdd = () => {
  isAdd.value = true
  dialogTitle.value = '生成卡密'
  dialogVisible.value = true
  // 获取代理列表
  if (userStore.userType === '管理员') {
    fetchAgentList()
  }
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    type: 4,
    count: 1,
    duration: 1,
    remark: '',
    agentVisible: 0,
    payType: ''
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isAdd.value) {
          if (userStore.userType === '代理') {
            await createOrder()
          } else {
            await addCard()
          }
        } else {
          await editCard(1)
        }
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 计算支付金额
const calculateAmount = (type, count, duration) => {
  const prices = {
    1: 2,  // 时卡价格
    2: 5,  // 天卡价格
    3: 30,  // 周卡价格
    4: 140, // 月卡价格
    5: 300, // 季卡价格
    6: 800  // 年卡价格
  }
  return (prices[type] || 0) * count * duration
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该卡密吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    currentRow.value = row
    await editCard(5)  // 删除卡密
  })
}

// 添加倒计时状态
const countdown = ref(120)
let timer = null

const createOrder = async () => {
  try {
    const res = await request({
      url: '/admin/order',
      method: 'post',
      data: {
        type: formData.type,
        duration: formData.duration,
        num: formData.count,
        id: formData.agentVisible || undefined,
        state: formData.status,
        remark: formData.remark,
        pay: formData.payType
      }
    })
    if (res.status === 0) {
      dialogVisible.value = false

      // 重置倒计时
      countdown.value = 175

      ElMessageBox.alert(
        `
        <div style="text-align: center;">
          <h3 style="margin-bottom: 20px;">请扫码支付</h3>
          <div style="margin-bottom: 15px;">
            <span style="color: #909399; font-size: 14px;">订单号：${res.data.order_id}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <span style="font-size: 16px;">应付金额：</span>
            <span style="color: #f56c6c; font-size: 24px; font-weight: bold;">￥${res.data.money}</span>
          </div>
         <div style="margin-bottom: 10px;">
           <span style="color: #909399;">支付倒计时：</span>
           <span style="color: #f56c6c;" id="countdown">${countdown.value}</span>
           <span style="color: #909399;">秒</span>
         </div>
          <div style="display: flex; justify-content: center; margin: 20px 0;">
            <img src="${res.data.qrcode}" style="width: 200px; height: 200px;" />
          </div>
          <div style="color: #f56c6c; font-size: 14px; margin-bottom: 10px;">
            请务必支付正确金额，多付或少付不发货
          </div>
          <div style="color: #909399; font-size: 14px;">支付完成后请点击确定</div>
        </div>
        `,
        '扫码支付',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '支付完成',
          showCancelButton: true,
          cancelButtonText: '取消',
          customClass: 'payment-dialog',
          beforeClose: (action, instance, done) => {
            // 清除定时器
            if (timer) {
              console.log('清除定时器');

              clearInterval(timer)
              timer = null
            }
            done()
          },
          callback: (action) => {
            if (action === 'confirm') {
              handleQrcode(res.data.order_id)
            }
          }
        }
      )

      // 开始倒计时
      nextTick(() => {
        const countdownEl = document.getElementById('countdown')
        timer = setInterval(() => {
          countdown.value--
          if (countdownEl) {
            countdownEl.textContent = countdown.value
          }
          if (countdown.value <= 0) {
            clearInterval(timer)
            timer = null
            closeOrder(res.data.order_id)
            ElMessageBox.close()
            ElMessage.warning('支付超时，请重新生成订单')
          }
          if (countdown.value % 2 == 0) handleQrcode(res.data.order_id)
        }, 1000)
      })
    } else {
      ElMessage.error(res.msg || '创建失败')
    }
  } catch (error) {
    console.error('创建订单错误:', error)
    ElMessage.error(res.msg || '创建失败')
    throw error
  }
}

// 查询订单是否支付完成
const handleQrcode = async (order_id) => {
  try {
    const res = await request({
      url: '/admin/order',
      method: 'get',
      params: { order: order_id }
    })
    if (res.status == 2 && res.msg == '订单已完成') {
      // 关闭定时器
      clearInterval(timer)
      timer = null
      // 关闭扫码支付对话框
      ElMessageBox.close()
      ElMessage.success('支付成功')

      const cardList = res.data.card.map(item => {
        return `
            <div style="margin-bottom: 10px;">
              <div style="margin-bottom: 5px;">
                <span style="color: #909399; margin-right: 10px;">类型：${item.type}</span>
                <span style="color: #909399;">时长：${item.duration}</span>
              </div>
              <div style="color: #409EFF; font-family: monospace; font-size: 16px;">
                ${item.card}
              </div>
            </div>
          `
      }).join('')

      ElMessageBox.alert(
        `
          <div style="max-height: 400px; overflow-y: auto;">
            ${cardList}
          </div>
          `,
        `成功生成 ${res.data.num} 张卡密`,
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '复制卡密',
          closeOnClickModal: false,
          closeOnPressEscape: false,
          callback: () => {
            navigator.clipboard.writeText(res.data.card.map(item => item.card).join('\n'))
              .then(() => ElMessage.success('复制成功'))
              .catch(() => ElMessage.error('复制失败'))
          }
        }
      )
    }
  } catch (error) {
    console.error('查询订单错误:', error)
    ElMessage.error('查询失败')
  }
}


// 超时关闭订单
const closeOrder = async (order_id) => {
  try {
    const res = await request({
      url: '/admin/order',
      method: 'put',
      data: {
        order_id: order_id,
      }
    })
  } catch (error) {
    console.error('关闭订单错误:', error)

  }
}


// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

// 生成卡密 - 管理员
const addCard = async () => {
  try {
    const res = await request({
      url: '/admin/card',
      method: 'post',
      data: {
        type: formData.type,
        duration: formData.duration,
        num: formData.count,
        id: formData.agentVisible || undefined,
        state: formData.status,
        remark: formData.remark
      }
    })

    if (res.status === 0) {
      if (res.data.card?.length > 0) {
        const cardList = res.data.card.map(item => {
          return `
            <div style="margin-bottom: 10px;">
              <div style="margin-bottom: 5px;">
                <span style="color: #909399; margin-right: 10px;">类型：${item.type}</span>
                <span style="color: #909399;">时长：${item.duration}</span>
              </div>
              <div style="color: #409EFF; font-family: monospace; font-size: 16px;">
                ${item.card}
              </div>
            </div>
          `
        }).join('')

        ElMessageBox.alert(
          `
          <div style="max-height: 400px; overflow-y: auto;">
            ${cardList}
          </div>
          `,
          `成功生成 ${res.data.num} 张卡密`,
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '复制卡密',
            closeOnClickModal: false,
            closeOnPressEscape: false,
            callback: () => {
              navigator.clipboard.writeText(res.data.card.map(item => item.card).join('\n'))
                .then(() => ElMessage.success('复制成功'))
                .catch(() => ElMessage.error('复制失败'))
            }
          }
        )
      }
      dialogVisible.value = false
      fetchCardList()
    } else {
      ElMessage.error(res.msg || '生成失败')
    }
  } catch (error) {
    console.error('生成卡密错误:', error)
    ElMessage.error('生成失败')
  }
}

const editCard = async (editType) => {
  try {
    const res = await request({
      url: '/admin/card',
      method: 'put',
      data: {
        id: currentRow.value.id,
        edit: editType,
        card: editType == 1 ? userStore.userType === '管理员' ? formData.cardNo : undefined : undefined,
        type: editType == 1 ? userStore.userType === '管理员' ? formData.type : undefined : undefined,
        duration: editType == 1 ? userStore.userType === '管理员' ? formData.duration : undefined : undefined,
        state: editType == 1 ? formData.status : undefined,
        remark: editType == 1 ? formData.remark : undefined,
      }
    })

    if (res.status === 0) {
      ElMessage.success(res.msg || '修改成功')
      dialogVisible.value = false
      fetchCardList()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改卡密错误:', error)
    ElMessage.error('修改失败')
  }
}

const handleRecover = (row) => {
  ElMessageBox.confirm(
    '恢复后卡密将可以正常使用，是否继续？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    currentRow.value = row
    await editCard(4)  // 恢复卡密
  })
}

const handleToggleStatus = (row) => {
  const action = row.status == 0 ? '禁用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}该卡密吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    currentRow.value = row
    // 根据当状态定是禁用还是启用
    await editCard(row.status == 0 ? 2 : 3)
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

const handleCopy = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 添加当前编辑行的引用
const currentRow = ref(null)

const handleEdit = (row) => {
  currentRow.value = row
  isAdd.value = false
  dialogTitle.value = '编辑卡密'
  dialogVisible.value = true
  // 获取代理列表
  if (userStore.userType === '管理员') {
    fetchAgentList()
  }


  const agent = agentList.value.find(item => item.id == row.agent)


  // 填充表单数据
  Object.assign(formData, {
    cardNo: row.cardNo,
    type: getTypeNum(row.type),
    duration: row.duration,
    remark: row.remark || '',
    status: row.status,
    agentVisible: agent ? agent.id : 0,
  })
}
</script>

<style scoped>
.cards-container {
  padding: 20px;
}

.card-wrapper {
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.card-wrapper :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-wrapper :deep(.el-table) {
  flex: 1;
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

/* 加载遮罩层式 */
:deep(.el-loading-mask) {
  backdrop-filter: blur(1px);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整固定列的样式 */
:deep(.el-table__fixed-right) {
  height: 100% !important;
  bottom: 0 !important;
}

:deep(.el-table__fixed) {
  height: 100% !important;
  bottom: 0 !important;
}

.payment-methods {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  width: 100%;
}

.payment-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
  gap: 8px;
  width: 80px;
}

/* 选中状态的样式 */
:deep(.el-radio.is-checked .payment-method) {
  background-color: var(--el-color-primary-light-9);
}

/* 修改单选框的样式 */
:deep(.el-radio) {
  margin-right: 0;
  height: auto;
  flex: 1;
  max-width: 33.33%;
}

:deep(.el-radio__input) {
  display: none;
}

:deep(.el-radio__label) {
  padding: 0;
  width: 100%;
}

.payment-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 4px;
}

/* 支付方式文字样式 */
.payment-method span {
  font-size: 14px;
  color: #606266;
  display: block;
  text-align: center;
  width: 100%;
  white-space: nowrap;
}

/* 中状态的文字样式 */
:deep(.el-radio.is-checked .payment-method span) {
  color: var(--el-color-primary);
}

.amount-wrapper {
  display: flex;
  align-items: center;
  height: 32px;
  /* 与其他表单项高度一致 */
}

.amount {
  font-size: 16px;
  color: #606266;
  display: flex;
  align-items: center;
}

.amount .currency {
  color: #f56c6c;
  margin-right: 4px;
  font-size: 16px;
  line-height: 1;
}

.amount .number {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

/* 支付对话框样式 */
:global(.payment-dialog) {
  width: 400px !important;
}

:global(.payment-dialog .el-message-box__content) {
  padding: 20px;
}

:global(.payment-dialog .el-message-box__header) {
  padding-bottom: 0;
}

:global(.payment-dialog .el-message-box__title) {
  font-size: 18px;
  font-weight: 500;
}

:global(.payment-dialog .el-message-box__container) {
  display: flex;
  justify-content: center;
}
</style>