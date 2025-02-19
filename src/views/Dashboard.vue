<template>
  <div class="dashboard-container">
    <!-- 数据统计卡片 -->
    <el-row :gutter="20">
      <el-col :xs="12" :sm="12" :md="userStore.userType == '管理员' ? 6 : 8">
        <el-card shadow="hover" class="data-card">
          <div class="data-header">
            <span class="label">用户总数</span>
            <el-icon class="icon">
              <User />
            </el-icon>
          </div>
          <div class="data-body">
            <span class="number">{{ statistics.totalUsers }}</span>
            <span class="trend" :class="{ up: statistics.userTrend > 0 }">
              {{ statistics.userTrend }}%
              <el-icon>
                <ArrowUp v-if="statistics.userTrend > 0" />
                <ArrowDown v-else />
              </el-icon>
            </span>
          </div>
          <div class="data-footer">
            今日新增：{{ statistics.newUsers }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="userStore.userType == '管理员' ? 6 : 8">
        <el-card shadow="hover" class="data-card">
          <div class="data-header">
            <span class="label">卡密总数</span>
            <el-icon class="icon">
              <CreditCard />
            </el-icon>
          </div>
          <div class="data-body">
            <span class="number">{{ statistics.totalCards }}</span>
            <span class="sub-number">未使用：{{ statistics.unusedCards }}</span>
          </div>
          <div class="data-footer">
            今日使用：{{ statistics.todayUsedCards }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="userStore.userType == '管理员' ? 6 : 8">
        <el-card shadow="hover" class="data-card">
          <div class="data-header">
            <span class="label">文件总数</span>
            <el-icon class="icon">
              <Folder />
            </el-icon>
          </div>
          <div class="data-body">
            <span class="number">{{ statistics.totalFiles }}</span>
            <span class="sub-number" v-if="userStore.userType == '管理员'">
              图片：{{ statistics.imageFiles }} / 曲谱：{{ statistics.scoreFiles }}
            </span>
          </div>
          <div class="data-footer">
            今日上传：{{ statistics.todayFiles }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" v-if="userStore.userType == '管理员'">
        <el-card shadow="hover" class="data-card">
          <div class="data-header">
            <span class="label">待审核</span>
            <el-icon class="icon">
              <Bell />
            </el-icon>
          </div>
          <div class="data-body">
            <span class="number">{{ statistics.pendingCount }}</span>
          </div>
          <div class="data-footer">
            <el-button type="primary" link @click="$router.push('/info/pending')">
              查看详情
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户趋势</span>
              <el-radio-group v-model="userChartType" size="small">
                <el-radio-button label="login">登录量</el-radio-button>
                <el-radio-button label="register">注册量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="userChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>卡密分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart :option="cardPieOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待审核列表 -->
    <el-row class="list-row" v-if="userStore.userType == '管理员'">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新待审核</span>
              <el-button type="primary" link @click="$router.push('/info/pending')">
                查看更多
              </el-button>
            </div>
          </template>
          <el-table :data="pendingList" style="width: 100%">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="opType" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getOpTypeTag(row.opType)">{{ getOpTypeText(row.opType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="username" label="提交用户" width="310" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import request from '../utils/request'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册必需的组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const userStore = useUserStore()

// 统计数据
const statistics = ref({
  totalUsers: 0,      // 用户总数
  newUsers: 0,        // 今日新增用户
  userTrend: 0,       // 用户增长趋势
  totalCards: 0,      // 卡密总数
  unusedCards: 0,     // 未使用卡密数
  todayUsedCards: 0,  // 今日使用卡密数
  totalFiles: 0,      // 文件总数
  imageFiles: 0,      // 图片文件数
  scoreFiles: 0,      // 曲谱文件数
  todayFiles: 0,      // 今日上传文件数
  pendingCount: 0      // 待审核数量
})

// 用户图表类型（登录/注册）
const userChartType = ref('login')

// 用户图表配置
const userChartOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']  // 模拟时间数据
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [30, 40, 35, 50, 45, 65, 70],  // 模拟用户数据
    type: 'line',
    smooth: true
  }]
})

// 卡密饼图配置
const cardPieOption = ref({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [{
    type: 'pie',
    radius: '50%',
    data: []  // 数据将从接口获取
  }]
})

// 待审核列表数据
const pendingList = ref([])

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const res = await request({
      url: '/admin/dashboard',
      method: 'get'
    })
    if (res.status === 0) {
    

      // 更新统计数据
      statistics.value = {
        totalUsers: res.data.totalUsers,
        newUsers: res.data.newUsers,
        userTrend: res.data.userTrend,
        totalCards: res.data.totalCards,
        unusedCards: res.data.unusedCards,
        todayUsedCards: res.data.todayUsedCards,
        totalFiles: res.data.totalFiles,
        imageFiles: res.data.imageFiles,
        scoreFiles: res.data.scoreFiles,
        todayFiles: res.data.todayFiles,
        pendingCount: res.data.pendingCount
      }

      // 更新用户趋势图数据
      if (userChartType.value === 'register') {
        userChartOption.value.xAxis.data = res.data.register.map(item => item.month)
        userChartOption.value.series[0].data = res.data.register.map(item => item.registration_count)
      } else {
        userChartOption.value.xAxis.data = res.data.login.map(item => item.login_date)
        userChartOption.value.series[0].data = res.data.login.map(item => item.login_count)
      }

      if (userStore.userType === '管理员') {
        // 更新待审核列表
        pendingList.value = res.data.create.map(item => ({
          id: Date.now(), // 临时ID
          type: getTypeNumber(item.type),
          opType: getOpTypeNumber(item.operate),
          name: item.name,
          username: item.username,
          createTime: item.create_time
        }))
      }


      // 更新卡密分布数据
      cardPieOption.value.series[0].data = res.data.cardPieOption.map(item => ({
        value: item.count_per_type,
        name: item.type
      }))
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 类型文本转数字
const getTypeNumber = (typeText) => {
  const types = {
    '求生者': 1,
    '监管者': 2,
    '道具': 3
  }
  return types[typeText] || 1
}

// 操作类型文本转数字
const getOpTypeNumber = (opText) => {
  const types = {
    '添加': 1,
    '删除': 2
  }
  return types[opText] || 1
}

// 获取类型标签样式
const getTypeTag = (type) => {
  const types = {
    1: 'success',  // 求生者
    2: 'warning',  // 监管者
    3: 'info'      // 道具
  }
  return types[type] || 'info'
}

// 获取类型文本
const getTypeText = (type) => {
  const texts = {
    1: '求生者',
    2: '监管者',
    3: '道具'
  }
  return texts[type] || '未知'
}

// 获取操作类型标签样式
const getOpTypeTag = (opType) => {
  const types = {
    1: 'success',  // 增加
    2: 'danger'    // 删除
  }
  return types[opType] || 'info'
}

// 获取操作类型文本
const getOpTypeText = (opType) => {
  const texts = {
    1: '增加',
    2: '删除'
  }
  return texts[opType] || '未知'
}

// 监听图表类型变化
watch(userChartType, () => {
  fetchStatistics()  // 重新获取数据以更新图表
})

// 页面加载时获取数据
onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.chart-row {
  margin-top: 20px;
}

.list-row {
  margin-top: 20px;
}

.data-card {
  height: 180px;
  display: flex;
  flex-direction: column;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-header .label {
  font-size: 16px;
  color: #606266;
}

.data-header .icon {
  font-size: 24px;
  color: #409EFF;
}

.data-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.data-body .number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.data-body .sub-number {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.data-body .trend {
  font-size: 14px;
  color: #F56C6C;
  margin-left: 10px;
}

.data-body .trend.up {
  color: #67C23A;
}

.data-footer {
  font-size: 14px;
  color: #909399;
  margin-top: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

@media screen and (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }

  .data-card {
    margin-bottom: 20px;
  }

  .chart-container {
    height: 250px;
  }

  .data-header .label {
    font-size: 14px;
  }

  .data-body .number {
    font-size: 24px;
  }
}
</style>