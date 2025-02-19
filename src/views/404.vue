<template>
  <div class="not-found">
    <div class="stars"></div>
    <div class="content">
      <div class="error-code">
        <div class="number">4</div>
        <div class="planet">
          <div class="planet-ring"></div>
          <div class="planet-surface">
            <div class="crater" v-for="i in 5" :key="i"></div>
          </div>
          <div class="astronaut">
            <div class="astronaut-helmet"></div>
            <div class="astronaut-body"></div>
          </div>
        </div>
        <div class="number">4</div>
      </div>
      <h2>迷失在数字宇宙中...</h2>
      <p>看起来您访问的页面已经漂流到了未知的星系</p>
      <div class="actions">
        <el-button type="primary" size="large" @click="$router.push('/')" class="home-btn">
          <el-icon><HomeFilled /></el-icon>
          返回主星球
        </el-button>
        <el-button size="large" @click="$router.back()" class="back-btn">
          <el-icon><Back /></el-icon>
          时空回溯
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { HomeFilled, Back } from '@element-plus/icons-vue'
</script>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, #0a1930 0%, #1a2942 100%);
  overflow: hidden;
  position: relative;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 50px 160px, #fff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 200px 200px;
  animation: twinkle 3s ease-in-out infinite;
}

.content {
  text-align: center;
  z-index: 1;
  padding: 40px;
}

.error-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
}

.number {
  font-size: 180px;
  font-weight: bold;
  color: #61dafb;
  text-shadow: 0 0 20px rgba(97, 218, 251, 0.5);
  animation: glow 2s ease-in-out infinite alternate;
}

.planet {
  position: relative;
  width: 160px;
  height: 160px;
  animation: float 6s ease-in-out infinite;
}

.planet-surface {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  border-radius: 50%;
  box-shadow: inset -20px -20px 50px rgba(0,0,0,0.2),
              0 0 30px rgba(255,107,107,0.4);
  overflow: hidden;
  position: relative;
}

.planet-ring {
  position: absolute;
  width: 200%;
  height: 20px;
  background: linear-gradient(90deg, #ffd93d 0%, rgba(255,217,61,0.2) 100%);
  top: 50%;
  left: -50%;
  transform: rotate(-20deg);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255,217,61,0.3);
}

.crater {
  position: absolute;
  background: rgba(0,0,0,0.1);
  border-radius: 50%;
}

.crater:nth-child(1) { width: 30px; height: 30px; top: 20%; left: 25%; }
.crater:nth-child(2) { width: 20px; height: 20px; top: 40%; left: 60%; }
.crater:nth-child(3) { width: 35px; height: 35px; top: 60%; left: 40%; }
.crater:nth-child(4) { width: 15px; height: 15px; top: 30%; left: 70%; }
.crater:nth-child(5) { width: 25px; height: 25px; top: 70%; left: 20%; }

.astronaut {
  position: absolute;
  width: 40px;
  height: 60px;
  top: -30px;
  left: 60px;
  animation: float-astronaut 4s ease-in-out infinite;
}

.astronaut-helmet {
  width: 30px;
  height: 30px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 5px;
}

.astronaut-body {
  width: 20px;
  height: 30px;
  background: #fff;
  position: absolute;
  bottom: 0;
  left: 10px;
  border-radius: 10px;
}

h2 {
  font-size: 36px;
  color: #fff;
  margin: 0 0 15px;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}

p {
  font-size: 18px;
  color: #a8b2d1;
  margin: 0 0 40px;
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.actions .el-button {
  min-width: 140px;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.home-btn {
  background: linear-gradient(45deg, #61dafb, #4fa3ff) !important;
  border: none !important;
}

.back-btn {
  background: transparent !important;
  border: 2px solid #61dafb !important;
  color: #61dafb !important;
}

.actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(97, 218, 251, 0.3);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes float-astronaut {
  0%, 100% { transform: translate(0, 0) rotate(5deg); }
  50% { transform: translate(10px, -10px) rotate(-5deg); }
}

@keyframes glow {
  from { text-shadow: 0 0 10px rgba(97, 218, 251, 0.5); }
  to { text-shadow: 0 0 20px rgba(97, 218, 251, 0.8), 0 0 30px rgba(97, 218, 251, 0.6); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media screen and (max-width: 768px) {
  .content {
    padding: 20px;
    width: 90%;
  }

  .number {
    font-size: 120px;
  }

  .planet {
    width: 120px;
    height: 120px;
  }

  h2 {
    font-size: 28px;
  }

  p {
    font-size: 16px;
  }

  .actions {
    flex-direction: column;
  }

  .actions .el-button {
    width: 100%;
  }
}
</style> 