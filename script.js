function setupSoundControl() {
  const soundToggle = document.getElementById('sound-toggle');
  const soundStatus = document.getElementById('sound-status');
  const tickSound = document.getElementById('tick-sound');
  let soundEnabled = true;
  
  // 初始音量设置
  tickSound.volume = 0.3;
  
  soundToggle.addEventListener('click', function() {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
      this.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundStatus.textContent = '已启用';
      tickSound.volume = 0.3;
    } else {
      this.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundStatus.textContent = '已禁用';
      tickSound.volume = 0;
    }
  });

// 添加用户交互解锁
  document.addEventListener('click', unlockAudio, { once: true });
}

// 解锁音频功能
function unlockAudio() {
  const tickSound = document.getElementById('tick-sound');
  tickSound.volume = 0.001; // 几乎静音
  tickSound.play().then(() => {
    tickSound.pause();
    tickSound.currentTime = 0;
    tickSound.volume = 0.3; // 恢复默认音量
  }).catch(e => console.log('音频解锁成功'));
}

function createTickEffect() {
  // 创建视觉元素
  const tick = document.createElement('div');
  tick.className = 'tick-animation';
  
  // 在时钟周围随机位置
  const rect = clockSection.getBoundingClientRect();
  const x = rect.left + 20 + Math.random() * (rect.width - 40);
  const y = rect.top + 20 + Math.random() * (rect.height - 40);
  
   // 修改播放部分：
  if (tickSound.volume > 0) {
    try {
      // 克隆音频元素避免播放中断
      const clone = tickSound.cloneNode(true);
      clone.volume = tickSound.volume;
      clone.play().catch(e => console.log('滴答声播放失败'));
      setTimeout(() => clone.remove(), 1000);
    } catch (e) {
      console.error('音频播放错误:', e);
    }
  
  // 移除动画元素
  setTimeout(() => {
    tick.remove();
  }, 1200);
}

// 每秒触发一次滴答效果
setInterval(() => {
  const now = new Date();
  if (now.getSeconds() !== lastSecond) {
    lastSecond = now.getSeconds();
    createTickEffect();
  }
}, 100);

// ================= 修复后的核心功能 =================
// 1. 获取ClimateClock数据（使用备用方法）
async function fetchClimateData() {
  // 显示加载指示器
  document.getElementById('clock-loader').style.display = 'block';
  document.getElementById('clock-error').style.display = 'none';
  
  try {
    // 方法1：尝试直接请求（在Koder中可能有效）
    try {
      //const directResponse = await fetch('https://climateclock.world/v2/clock.json');
const directResponse = await fetch('https://climateclock.world/widget-v2.js');
      if (directResponse.ok) {
        const data = await directResponse.json();
        processClimateData(data);
        return;
      }
    } catch (directError) {
      console.log('直接请求失败，尝试备用方法');
    }
    
    // 方法2：使用JSONP替代方案
    //const jsonpUrl = `https://jsonp.afeld.me/?url=${encodeURIComponent('https://climateclock.world/v2/clock.json')}&callback=handleClimateData`;
const jsonpUrl = `https://jsonp.afeld.me/?url=${encodeURIComponent('https://climateclock.world/widget-v2.js')}&callback=handleClimateData`;
    const script = document.createElement('script');
    script.src = jsonpUrl;
    document.head.appendChild(script);
    
    // 设置超时处理
    setTimeout(() => {
      if (!window.climateDataReceived) {
        throw new Error('API响应超时');
      }
    }, 5000);
    
  } catch (error) {
    console.error("数据获取失败:", error);
    handleDataError(error);
  }
}

// 2. JSONP回调函数
function handleClimateData(data) {
  window.climateDataReceived = true;
  processClimateData(data);
}

// 3. 处理气候数据
function processClimateData(data) {
  // 确保数据存在
  if (!data || !data.data || !data.data.modules) {
    throw new Error('API返回无效数据');
  }
  
  // 更新主时钟
  const deadlineData = data.data.modules.deadline;
  const deadlineTime = deadlineData.time || "5 08 24 16"; // 默认值
  const formattedTime = deadlineTime.replace(/\s+/g, ':');
  document.getElementById('deadline').textContent = formattedTime;
  
  // 更新可再生能源数据
  const renewableData = data.data.modules.renewable;
  const renewablePercent = renewableData.percentage ? 
        Math.round(renewableData.percentage) : 14; // 默认值
  document.getElementById('renewable').textContent = `${renewablePercent}%`;
  
  // 更新碳预算
  const carbonBudget = 67 - (100 - renewablePercent) * 0.33;
  document.getElementById('carbon-budget').textContent = `${Math.max(0, carbonBudget).toFixed(1)}%`;
  
  // 更新最后刷新时间
  updateTimestamp();
  
  // 隐藏加载指示器
  document.getElementById('clock-loader').style.display = 'none';
}

// 4. 处理数据错误
function handleDataError(error) {
  console.error("数据获取失败:", error);
  document.getElementById('clock-error').textContent = 
    `数据加载失败: ${error.message || '请检查网络连接'}`;
  document.getElementById('clock-error').style.display = 'block';
  
  // 使用默认值显示
  document.getElementById('deadline').textContent = "05:08:24:16";
  document.getElementById('renewable').textContent = "14%";
  document.getElementById('carbon-budget').textContent = "58.2%";
  updateTimestamp();
  
  // 隐藏加载指示器
  document.getElementById('clock-loader').style.display = 'none';
}

// 5. 更新时间戳
function updateTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  document.getElementById('update-time').textContent = `${hours}:${minutes}:${seconds}`;
}

// 6. 影片章节控制（保持不变）
function setupVideoControls() {
  const buttons = document.querySelectorAll('.action-btn[data-chapter]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const chapter = btn.dataset.chapter;
      seekToChapter(chapter);
    });
  });
}

// 7. 章节跳转函数（保持不变）
function seekToChapter(chapter) {
  const player = document.getElementById('climate-video');
  const chapters = {
    'crisis': 30,     // 30秒处开始危机章节
    'solutions': 240  // 4分钟处解决方案
  };
  
  if (player && player.contentWindow) {
    player.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [chapters[chapter], true]
    }), '*');
    
    // 添加视觉反馈
    const button = document.querySelector(`.action-btn[data-chapter="${chapter}"]`);
    button.style.backgroundColor = '#ffd166';
    button.style.color = '#0a1929';
    setTimeout(() => {
      button.style.backgroundColor = '';
      button.style.color = '';
    }, 1000);
  }
}

// 8. 刷新按钮功能（保持不变）
document.getElementById('refresh-btn').addEventListener('click', function() {
  window.climateDataReceived = false; // 重置状态
  fetchClimateData();
  this.textContent = "刷新中...";
  setTimeout(() => {
    this.textContent = "刷新数据";
  }, 2000);
});

// 9. 实时更新时钟显示（保持不变）
function startLiveClockUpdate() {
  setInterval(() => {
    const timeParts = document.getElementById('deadline').textContent.split(':');
    if (timeParts.length === 4) {
      let [days, hours, minutes, seconds] = timeParts.map(Number);
      
      // 减少一秒
      seconds--;
      if (seconds < 0) {
        seconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
          if (hours < 0) {
            hours = 23;
            days--;
          }
        }
      }
      
      // 更新显示
      document.getElementById('deadline').textContent = 
        `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// ================= 启动应用 =================
document.addEventListener('DOMContentLoaded', () => {
  // 初始化全局标志
  window.climateDataReceived = false;
  
  // 初始加载数据
  fetchClimateData();
  
  // 设置控制按钮
  setupVideoControls();
  
  // 启动实时时钟更新
  startLiveClockUpdate();
});