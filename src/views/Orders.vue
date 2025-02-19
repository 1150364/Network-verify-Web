<template>
    <div class="orders-container">
        <el-card v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)"
            :element-loading-svg="loadingSvg" element-loading-svg-view-box="-10, -10, 50, 50">
            <template #header>
                <div class="header">
                    <div class="right">
                        <el-select v-model="searchStatus" placeholder="支付状态" clearable style="width: 120px"
                            @change="handleSearch">
                            <el-option label="未支付" :value="1" />
                            <el-option label="已支付" :value="2" />
                        </el-select>
                        <el-select v-model="searchPayType" placeholder="支付方式" clearable style="width: 120px"
                            @change="handleSearch">
                            <el-option label="QQ支付" :value="1" />
                            <el-option label="微信支付" :value="2" />
                            <el-option label="支付宝" :value="3" />
                        </el-select>
                        <el-input v-model="searchKeyword" :placeholder=" userStore.userType == '管理员' ? '订单号/用户名' : '订单号'"
                            style="width: 200px" clearable @clear="handleSearch" />
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                    </div>
                </div>
            </template>

            <el-table :data="tableData" border style="width: 100%" @sort-change="handleSortChange"
                :default-sort="{ prop: 'create_time', order: 'descending' }">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="order_id" label="订单号" min-width="200" />
                <el-table-column v-if="userStore.userType == '管理员'" prop="username" label="用户名" width="200" />
                <el-table-column label="订单金额" width="120" align="center">
                    <template #default="{ row }">
                        <span style="color: #f56c6c;">￥{{ row.money }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="支付金额" width="120" align="center">
                    <template #default="{ row }">
                        <span style="color: #67c23a;">￥{{ row.check_money || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="payType" label="支付方式" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getPayTypeTag(row.type)">
                            {{ getPayTypeText(row.type) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="create_time" label="创建时间" width="180" sortable="custom" align="center" />
                <el-table-column prop="update_time" label="支付时间" width="180" align="center">
                    <template #default="{ row }">
                        {{ row.update_time || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="支付状态" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.pay_state == 1 ? 'success' : 'info'">
                            {{ row.pay_state == 1 ? '已支付' : '未支付' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="订单状态" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.state || '0')">
                            {{ getStatusText(row.state || '0') }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleDetail(row)">查看详情</el-button>
                        <el-button v-if="(row.state == 0 || !row.state) && row.pay_state == 0" type="success" link
                            @click="handleQrcode(row)">
                            去支付
                        </el-button>
                        <el-button v-if="(row.state == 0 || !row.state) && row.pay_state == 0" type="danger" link
                            @click="handleClose(row)">
                            关闭
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const searchStatus = ref(null)
const searchPayType = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const sortCreate = ref(1)  // 创建时间排序：1=倒序 2=升序
const tableData = ref([])

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

// 获取订单列表
const fetchOrderList = async () => {
    loading.value = true
    try {
        const res = await request({
            url: '/admin/order/list',
            method: 'get',
            params: {
                page: currentPage.value,
                num: pageSize.value,
                state: searchStatus.value,
                pay: searchPayType.value,
                sort: sortCreate.value,
                search: searchKeyword.value || undefined
            }
        })

        if (res.status === 0) {
            tableData.value = res.data.order
            total.value = res.data.total
        } else {
            ElMessage.error(res.msg || '获取订单列表失败')
        }
    } catch (error) {
        console.error('获取订单列表错误:', error)
        ElMessage.error('获取订单列表失败')
    } finally {
        loading.value = false
    }
}

const getPayTypeTag = (type) => {
    const types = {
        1: '',        // QQ支付
        2: 'success', // 微信支付
        3: 'warning'  // 支付宝
    }
    return types[type] || 'info'
}

const getPayTypeText = (type) => {
    const texts = {
        1: 'QQ支付',
        2: '微信支付',
        3: '支付宝'
    }
    return texts[type] || '未知'
}
// 关闭订单
const handleClose = (row, silent = false) => {
    const closeOrder = async () => {
        try {
            const res = await request({
                url: '/admin/order',
                method: 'put',
                data: {
                    order_id: row.order_id,
                }
            })

            if (res.status === 0) {
                if (!silent) {
                    ElMessage.success('关闭成功')
                }
                fetchOrderList()
            } else {
                if (!silent) {
                    ElMessage.error(res.msg || '关闭失败')
                }
            }
        } catch (error) {
            console.error('关闭订单错误:', error)
            if (!silent) {
                ElMessage.error('关闭失败')
            }
        }
    }

    if (silent) {
        closeOrder()
        return
    }

    ElMessageBox.confirm(
        '确定要关闭该订单吗？关闭后订单将无法支付',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(closeOrder)
}

const handleSearch = () => {
    currentPage.value = 1
    fetchOrderList()
}

const handleSizeChange = (val) => {
    pageSize.value = val
    fetchOrderList()
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    fetchOrderList()
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
    if (prop === 'create_time') {
        sortCreate.value = order === 'descending' ? 1 : 2
    }
    fetchOrderList()
}

// 页面加载时获取数据
onMounted(() => {
    sortCreate.value = 1
    fetchOrderList()
})

const getStatusType = (status) => {
    const types = {
        0: 'warning',  // 待支付
        1: 'danger',   // 已关闭
        2: 'success'   // 已完成
    }
    return types[status] || 'info'
}

const getStatusText = (status) => {
    const texts = {
        0: '待支付',
        1: '已关闭',
        2: '已完成'
    }
    return texts[status] || '未知'
}

// 复制文本到剪贴板
const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success('卡号已复制')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}

// 查看订单详情
const handleDetail = (row) => {
    // 格式化商品信息显示
    const formatGoodsInfo = (data) => {
        if (!data) return '-'

        // 判断是否为数组(已支付)
        if (Array.isArray(data)) {
            return data.map((item, index) => {
                const info = [
                    `<div style="margin-bottom: ${index == data.length - 1 ? 0 : '8px'}">`,
                    `<div><b>商品${index + 1}：</b>${item.type} × ${item.duration}</div>`,
                    item.card ? `<div style="margin-left: 20px;">卡号：<button onclick="window.copyCard('${item.card}')" style="color: #409EFF; cursor: pointer; text-decoration: underline; background: none; border: none; padding: 0; font: inherit;">${item.card}</button></div>` : '',
                    `</div>`
                ].join('')
                return info
            }).join('')
        }

        // 未支付订单
        return `${data.type} × ${data.num} (时长：${data.duration})`
    }

    // 将复制函数挂载到 window 对象上
    window.copyCard = copyToClipboard

    ElMessageBox.alert(
        `
    <div style="text-align: left;">
      <p><b>订单号：</b>${row.order_id}</p>
      ${userStore.userType === '管理员' ? `<p><b>用户名：</b>${row.username}</p>` : ''}
      <p><b>订单金额：</b>￥${row.money}</p>
      <p><b>支付金额：</b>￥${row.check_money || '-'}</p>
      <p><b>商品信息：</b>${formatGoodsInfo(row.data)}</p>
      <p><b>支付方式：</b>${getPayTypeText(row.type)}</p>
      <p><b>支付状态：</b>${row.pay_state == 1 ? '已支付' : '未支付'}</p>
      <p><b>订单状态：</b>${getStatusText(row.state || '0')}</p>
      <p><b>创建时间：</b>${row.create_time}</p>
      <p><b>支付时间：</b>${row.update_time || '-'}</p>
    </div>
    `,
        '订单详情',
        {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '关闭',
            customClass: 'order-detail-dialog',
            beforeClose: (action, instance, done) => {
                // 清理 window 上的复制函数
                delete window.copyCard
                done()
            }
        }
    )
}
// 定时器
let timer = null
// 查看订单支付二维码 去支付按钮点击事件
const handleQrcode = async (row, silent = false) => {
    // 添加倒计时状态
    const countdown = ref(180)

    try {
        const res = await request({
            url: '/admin/order',
            method: 'get',
            params: {
                order: row.order_id
            }
        })
        if (res.status === 0) {
            if (!silent) {
                countdown.value = parseInt(175 - (new Date().getTime() - new Date(row.create_time).getTime()) / 1000)  // 改为3分钟
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
          <div style="color: #909399; font-size: 14px;">支付完成后请等待回调自动跳转或等待几秒后点击支付完成</div>
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
                                // 查询订单是否支付完成
                                handleQrcode(row, true)
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
                        // 倒计时结束
                        if (countdown.value <= 0) {
                            clearInterval(timer)
                            timer = null
                            // 如果订单状态为待支付，则关闭订单
                            if (row.state == 0) {
                                row.state = 1
                                handleClose(row, true)
                            }
                            // 关闭扫码支付对话框
                            ElMessageBox.close()
                            ElMessage.warning('支付超时，请重新创建订单')
                        }
                        // 每2秒刷新一次二维码
                        if (countdown.value % 2 == 0) {
                            handleQrcode(row, true)
                        }
                    }, 1000)
                })
            }

        } else {
            if (!silent) {
                if (res.msg == '订单已关闭') {
                    row.state = 1
                } else if (res.msg == '订单已完成') {
                    row.state = 2
                    row.pay_state = 1
                    row.update_time = res.data.update_time
                    ElMessage.success('订单已完成')
                    return
                }
                ElMessage.error(res.msg || '获取订单支付二维码失败')
            }

            // 如果订单已完成，则关闭扫码支付对话框且弹出卡密
            if (res.msg == '订单已完成' && silent) {
                // 关闭定时器
                clearInterval(timer)
                timer = null
                ElMessageBox.close()
                ElMessage.success('支付成功')
                // 刷新订单列表
                fetchOrderList()

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



        }
    } catch (error) {
        console.error('获取订单支付二维码错误:', error)
        ElMessage.error('获取订单支付二维码失败')
    }
}




// 组件卸载时清除定时器
onUnmounted(() => {
    if (timer) {
        console.log('清除定时器');
        clearInterval(timer)
        timer = null
    }
})
</script>

<style scoped>
.orders-container {
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

/* 订单详情对话框样式 */
:global(.order-detail-dialog .el-message-box__content) {
    max-height: 500px;
    overflow-y: auto;
}

:global(.order-detail-dialog p) {
    margin: 8px 0;
    line-height: 1.5;
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
