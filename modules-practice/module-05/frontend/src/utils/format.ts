import dayjs from 'dayjs';

/**
 * 格式化数字，添加千分位
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 格式化百分比
 */
export const formatPercent = (num: number, decimals: number = 2): string => {
  return `${num.toFixed(decimals)}%`;
};

/**
 * 格式化金额（亿元）
 */
export const formatAmount = (amount: number): string => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿元`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万元`;
  }
  return `${amount.toFixed(2)}元`;
};

/**
 * 格式化日期
 */
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 计算增长率
 */
export const calculateGrowth = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * 根据涨跌返回颜色
 */
export const getChangeColor = (value: number): string => {
  if (value > 0) return '#f5222d'; // 红色
  if (value < 0) return '#52c41a'; // 绿色
  return '#999'; // 灰色
};

/**
 * 返回涨跌文本
 */
export const getChangeText = (value: number): string => {
  if (value > 0) return `+${value.toFixed(2)}%`;
  if (value < 0) return `${value.toFixed(2)}%`;
  return '0.00%';
};
