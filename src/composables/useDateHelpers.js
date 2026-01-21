import { computed } from 'vue'

/**
 * @fileOverview 日期处理工具函数集合
 * 提供常用的日期格式化、计算和比较功能
 */

/**
 * 日期处理组合式函数
 * 提供中文环境下的日期格式化和操作工具
 * 
 * @returns {Object} 日期处理函数集合
 */
export function useDateHelpers() {
  /**
   * 格式化日期为指定格式
   * @param {Date|string} date - 日期对象或ISO字符串
   * @param {string} [format='full'] - 格式类型: full, short, yearMonth, monthDay, iso, relative
   * @returns {string} 格式化后的日期字符串
   */
  const formatDate = (date, format = 'full') => {
    const d = new Date(date)
    
    const formats = {
      full: () => d.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      short: () => d.toLocaleDateString('zh-CN', { 
        month: 'numeric', 
        day: 'numeric' 
      }),
      yearMonth: () => d.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'short' 
      }),
      monthDay: () => d.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric' 
      }),
      iso: () => d.toISOString().split('T')[0],
      relative: () => {
        const now = new Date()
        const diff = now - d
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        if (days === 0) return '今天'
        if (days === 1) return '昨天'
        if (days === -1) return '明天'
        if (days < 7 && days > 0) return `${days}天前`
        if (days > -7 && days < 0) return `${Math.abs(days)}天后`
        
        return formatDate(d, 'short')
      }
    }
    
    return formats[format]?.() || formats.full()
  }

  const getYear = (date) => new Date(date).getFullYear()
  const getMonth = (date) => new Date(date).getMonth()
  const getDay = (date) => new Date(date).getDate()
  
  const getDateDiff = (date1, date2) => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)
  }

  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  const isToday = (date) => isSameDay(date, new Date())

  const isInRange = (date, start, end) => {
    const d = new Date(date)
    const s = new Date(start)
    const e = new Date(end)
    return d >= s && d <= e
  }

  const addDays = (date, days) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  const addMonths = (date, months) => {
    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
  }

  const addYears = (date, years) => {
    const result = new Date(date)
    result.setFullYear(result.getFullYear() + years)
    return result
  }

  const getNearestDate = (targetDate, dates) => {
    const target = new Date(targetDate)
    let nearest = null
    let minDiff = Infinity

    dates.forEach(date => {
      const d = new Date(date)
      const diff = Math.abs(target - d)
      if (diff < minDiff) {
        minDiff = diff
        nearest = date
      }
    })

    return nearest
  }

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getMonthName = (month, short = false) => {
    const names = {
      full: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      short: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    }
    return names[short ? 'short' : 'full'][month]
  }

  const getQuarter = (date) => {
    const month = getMonth(date)
    return Math.floor(month / 3) + 1
  }

  const getSeasonName = (quarter) => {
    const names = ['春', '夏', '秋', '冬']
    return names[(quarter - 1) % 4]
  }

  const getDayOfWeek = (date, short = false) => {
    const d = new Date(date)
    const names = {
      full: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      short: ['日', '一', '二', '三', '四', '五', '六']
    }
    return names[short ? 'short' : 'full'][d.getDay()]
  }

  return {
    formatDate,
    getYear,
    getMonth,
    getDay,
    getDateDiff,
    isSameDay,
    isToday,
    isInRange,
    addDays,
    addMonths,
    addYears,
    getNearestDate,
    getDaysInMonth,
    getMonthName,
    getQuarter,
    getSeasonName,
    getDayOfWeek
  }
}
