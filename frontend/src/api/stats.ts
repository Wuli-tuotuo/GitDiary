import request from './request';
import type { StatsData } from '@/types';

// 获取统计数据
export function getStats(params?: {
  repositoryId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<StatsData> {
  return request.get('/stats', { params });
}
