<template>
  <div 
    class="empty-bubble"
    :class="[positionClass, { visible }]"
    :style="{ left: position + 'px' }"
  >
    <div class="bubble-content">
      <div class="bubble-icon">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>
      <div class="bubble-text">
        <span class="bubble-date">{{ formattedDate }}</span>
        <span class="bubble-message">{{ message }}</span>
      </div>
    </div>
    <div class="bubble-decoration"></div>
  </div>
</template>

<script setup>
/**
 * @fileOverview EmptyStateBubble.vue - 空状态气泡组件
 * 
 * 功能描述：
 * 1. 显示在两个记录之间时间间隔较大的位置
 * 2. 显示随机选择的心灵鸡汤式消息
 * 3. 根据月份显示不同主题的消息
 * 4. 带入场动画效果
 * 5. 交替显示在上方或下方
 */

import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  /** 气泡显示的日期 */
  date: {
    type: String,
    required: true
  },
  /** 在时间轴中的索引位置（决定上下位置） */
  index: {
    type: Number,
    required: true
  },
  /** 节点间距（像素） */
  gap: {
    type: Number,
    default: 260
  }
})

const visible = ref(false)

const positionClass = computed(() => {
  return props.index % 2 === 0 ? 'top' : 'bottom'
})

const position = computed(() => {
  return props.index * props.gap + 150
})

const formattedDate = computed(() => {
  const date = new Date(props.date)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})

const messages = [
  '这段时间正在沉淀...',
  '生活正在酝酿新的故事...',
  '静待花开的日子...',
  '平凡的日子里也有光...',
  '正在寻找下一个精彩...',
  '岁月静好，现世安稳...',
  '蓄势待发的时刻...',
  '光阴的故事正在书写...',
  '时光慢递，期待未来...',
  '每一天都值得被记录...',
  '正在用心感受生活...',
  '成长的路上，步履不停...'
]

const message = computed(() => {
  const month = new Date(props.date).getMonth()
  const seasonalMessages = {
    0: ['新年的钟声刚刚敲响...', '元旦快乐！'],
    1: ['春天还会远吗...', '二月春风似剪刀...'],
    2: ['春暖花开的季节...', '万物复苏的月份...'],
    3: ['人间四月天...', '清明时节雨纷纷...'],
    4: ['初夏的气息...', '五月榴花照眼明...'],
    5: ['夏日炎炎有你甜...', '六月的故事...'],
    6: ['暑假的自由时光...', '夏日悠长...'],
    7: ['秋天的第一杯奶茶...', '九月你好...'],
    8: ['金秋十月，丹桂飘香...', '秋高气爽的日子...'],
    9: ['深秋的温柔...', '十一月，感谢有你...'],
    10: ['冬天的第一场雪...', '初雪的日子里...'],
    11: ['岁末年初，辞旧迎新...', '十二月，温暖过冬...']
  }
  
  const seasonal = seasonalMessages[month] || messages
  const baseMessages = [...seasonal, ...messages]
  const seed = props.date.split('-').join('')
  const index = parseInt(seed) % baseMessages.length
  return baseMessages[index]
})

onMounted(() => {
  setTimeout(() => {
    visible.value = true
  }, 100)
})
</script>

<style scoped>
.empty-bubble {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}

.empty-bubble.visible {
  opacity: 1;
}

.empty-bubble.top {
  transform: translateY(-60%);
}

.empty-bubble.bottom {
  transform: translateY(-40%);
}

.empty-bubble.top.visible {
  transform: translateY(-55%);
}

.empty-bubble.bottom.visible {
  transform: translateY(-45%);
}

.bubble-content {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%);
  padding: 12px 16px;
  border-radius: 20px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(200, 200, 200, 0.15);
  backdrop-filter: blur(10px);
}

.empty-bubble.top .bubble-content {
  flex-direction: row-reverse;
}

.bubble-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8e4df 0%, #d4d0c8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a9590;
  flex-shrink: 0;
}

.bubble-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bubble-date {
  font-size: 10px;
  color: #999;
  font-weight: 500;
}

.bubble-message {
  font-size: 11px;
  color: #777;
  font-style: italic;
}

.bubble-decoration {
  position: absolute;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, rgba(200, 200, 200, 0.5) 0%, transparent 100%);
  border-radius: 50%;
}

.empty-bubble.top .bubble-decoration {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.empty-bubble.bottom .bubble-decoration {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  background: linear-gradient(135deg, transparent 0%, rgba(200, 200, 200, 0.5) 100%);
}

.empty-bubble:hover .bubble-content {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: scale(1.02);
}

.empty-bubble.top:hover .bubble-content {
  transform: translateY(2px);
}

.empty-bubble.bottom:hover .bubble-content {
  transform: translateY(-2px);
}
</style>
