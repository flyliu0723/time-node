import { computed } from 'vue'
import { useDateHelpers } from './useDateHelpers'

/**
 * @fileOverview 空状态气泡组合式函数
 * 生成时间轴上间隔较大时的填充气泡
 */

/**
 * 空状态气泡组合式函数
 * 当两个记录之间时间间隔超过阈值时，生成带随机消息的气泡填充
 * 
 * @param {Object} options - 配置选项
 * @param {number} [options.thresholdDays=45] - 间隔天数阈值，超过此值生成气泡
 * @returns {Object} 气泡生成函数
 */
export function useEmptyState(options = {}) {
  const { thresholdDays = 45 } = options

  const { addDays, getMonth, getMonthName, formatDate } = useDateHelpers()

  const seasonalMessages = {
    0: ['新年的钟声刚刚敲响...', '元旦快乐！', '新的一年，新的开始'],
    1: ['春天还会远吗...', '二月春风似剪刀...', '万物复苏的月份'],
    2: ['春暖花开的季节...', '三月春光好...', '播种希望的时节'],
    3: ['人间四月天...', '清明时节雨纷纷...', '春意盎然'],
    4: ['初夏的气息...', '五月榴花照眼明...', '夏初的光景'],
    5: ['夏日炎炎有你甜...', '六月荷塘...', '夏日的序章'],
    6: ['暑假的自由时光...', '七月流火...', '悠长夏日'],
    7: ['秋天的第一杯奶茶...', '九月你好...', '金秋将至'],
    8: ['金秋十月，丹桂飘香...', '秋高气爽的日子...', '收获的季节'],
    9: ['深秋的温柔...', '十一月，感谢有你...', '秋意渐浓'],
    10: ['冬天的第一场雪...', '初雪的日子里...', '冬日将至'],
    11: ['岁末年初，辞旧迎新...', '十二月，温暖过冬...', '年终总结的时候']
  }

  const baseMessages = [
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
    '成长的路上，步履不停...',
    '一些值得纪念的时刻即将到来...',
    '生活的小确幸正在积累...',
    '未来可期...'
  ]

  const getMessagesForMonth = (month) => {
    const monthMessages = seasonalMessages[month] || baseMessages
    return [...monthMessages, ...baseMessages]
  }

  /**
   * 根据日期生成随机的气泡消息
   * 使用日期作为随机种子，确保同一个日期总是返回相同的消息
   * 
   * @param {Date|string} date - 日期对象或ISO日期字符串
   * @returns {string} - 随机选择的消息
   */
  const getBubbleMessage = (date) => {
    const month = getMonth(date)
    const messages = getMessagesForMonth(month)
    
    // 将日期转换为整数种子，用于确定性随机选择
    // 例如: "2023-06-15" -> 20230615 -> 20230615 % messages.length
    const dateStr = date instanceof Date 
      ? date.toISOString().split('T')[0]  // Date对象转 "YYYY-MM-DD"
      : date                            // 已经是字符串直接使用
    const seed = parseInt(dateStr.replace(/-/g, ''), 10)  // "2023-06-15" -> 20230615
    const index = seed % messages.length
    
    return messages[index]
  }

  const getBubblePosition = (currentIndex, gap) => {
    return currentIndex * gap + 150
  }

  const generateEmptyBubbles = (records, options = {}) => {
    const { gap = 260, threshold = thresholdDays, visibleRange = null } = options
    
    if (!records || records.length < 2) return []

    const bubbles = []

    for (let i = 0; i < records.length - 1; i++) {
      const current = new Date(records[i].date)
      const next = new Date(records[i + 1].date)
      const diffDays = (next - current) / (1000 * 60 * 60 * 24)

      if (diffDays > threshold) {
        const midDate = addDays(current, Math.floor(diffDays / 2))
        const bubbleIndex = i + 0.5
        const position = getBubblePosition(bubbleIndex, gap)
        const message = getBubbleMessage(midDate)

        const bubble = {
          date: midDate.toISOString().split('T')[0],
          index: bubbleIndex,
          position,
          message,
          formattedDate: formatDate(midDate, 'monthDay')
        }

        if (visibleRange) {
          const { start, end } = visibleRange
          if (bubbleIndex >= start && bubbleIndex <= end) {
            bubbles.push(bubble)
          }
        } else {
          bubbles.push(bubble)
        }
      }
    }

    return bubbles
  }

  const getBubbleByDate = (targetDate, records) => {
    const target = new Date(targetDate)
    const midPoints = []

    for (let i = 0; i < records.length - 1; i++) {
      const current = new Date(records[i].date)
      const next = new Date(records[i + 1].date)
      const diffDays = (next - current) / (1000 * 60 * 60 * 24)

      if (diffDays > thresholdDays) {
        const midDate = new Date(current.getTime() + (next - current) / 2)
        midPoints.push({
          date: midDate,
          index: i + 0.5,
          message: getBubbleMessage(midDate)
        })
      }
    }

    return getNearestDate(targetDate, midPoints.map(m => m.date))
  }

  return {
    getBubbleMessage,
    getBubblePosition,
    generateEmptyBubbles,
    getBubbleByDate
  }
}
