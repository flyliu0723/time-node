<template>
  <div class="grid-background">
    <div class="grid-layer layer-1"></div>
    <div class="grid-layer layer-2"></div>
    <div class="grid-layer layer-3"></div>
  </div>
</template>

<script setup>
/**
 * @fileOverview GridBackground.vue - 视差网格背景组件
 * 
 * 功能描述：
 * 1. 创建三层网格背景效果
 * 2. 根据滚动速度产生视差动画
 * 3. 添加悬浮动效增强空间感
 * 4. 使用 requestAnimationFrame 实现流畅动画
 */

import { onMounted, onUnmounted } from 'vue'

let rafId = null
let lastVelocity = 0
let currentParallax = { x: 0, y: 0 }

const updateParallax = () => {
  const parallaxEl = document.querySelector('.grid-background')
  if (!parallaxEl) return
  
  const gridEl1 = parallaxEl.querySelector('.layer-1')
  const gridEl2 = parallaxEl.querySelector('.layer-2')
  const gridEl3 = parallaxEl.querySelector('.layer-3')
  
  if (!gridEl1 || !gridEl2 || !gridEl3) return
  
  const velocity = parseFloat(getComputedStyle(parallaxEl).getPropertyValue('--scroll-velocity') || '0')
  
  if (Math.abs(velocity - lastVelocity) < 0.01 && Math.abs(currentParallax.x) < 0.5) {
    rafId = requestAnimationFrame(updateParallax)
    return
  }
  
  lastVelocity = velocity
  currentParallax.x += (velocity * 0.3 - currentParallax.x) * 0.1
  currentParallax.y += (velocity * 0.15 - currentParallax.y) * 0.1
  
  const clampedX = Math.max(-30, Math.min(30, currentParallax.x))
  const clampedY = Math.max(-15, Math.min(15, currentParallax.y))
  
  gridEl1.style.transform = `perspective(1000px) rotateX(0deg) translate(${clampedX * 0.3}px, ${clampedY * 0.2}px)`
  gridEl2.style.transform = `perspective(1000px) rotateX(5deg) scale(1.1) translate(${clampedX * 0.5}px, ${clampedY * 0.3}px)`
  gridEl3.style.transform = `perspective(1000px) rotateX(-3deg) scale(1.2) translate(${clampedX * 0.7}px, ${clampedY * 0.4}px)`
  
  rafId = requestAnimationFrame(updateParallax)
}

onMounted(() => {
  rafId = requestAnimationFrame(updateParallax)
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})
</script>

<style scoped>
.grid-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%);
}

.grid-layer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background-image: 
    linear-gradient(rgba(180, 180, 180, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(180, 180, 180, 0.3) 1px, transparent 1px);
  background-size: 60px 60px;
  will-change: transform;
}

.layer-1 {
  opacity: 1;
  animation: float1 20s ease-in-out infinite;
}

.layer-2 {
  opacity: 0.5;
  background-size: 120px 120px;
  animation: float2 25s ease-in-out infinite reverse;
}

.layer-3 {
  opacity: 0.3;
  background-size: 240px 240px;
  filter: blur(0.5px);
  animation: float3 30s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% {
    transform: perspective(1000px) rotateX(0deg) translateY(0);
  }
  50% {
    transform: perspective(1000px) rotateX(1deg) translateY(-10px);
  }
}

@keyframes float2 {
  0%, 100% {
    transform: perspective(1000px) rotateX(4deg) scale(1.1) translateY(0);
  }
  50% {
    transform: perspective(1000px) rotateX(6deg) scale(1.12) translateY(8px);
  }
}

@keyframes float3 {
  0%, 100% {
    transform: perspective(1000px) rotateX(-2deg) scale(1.2) translateY(0);
  }
  50% {
    transform: perspective(1000px) rotateX(-4deg) scale(1.22) translateY(-6px);
  }
}
</style>
