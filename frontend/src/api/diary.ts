import request from './request';
import type { Diary, GenerateDiaryRequest, GenerateDiaryResponse, PageResult, ShareLink } from '@/types';

// 生成日记
export function generateDiary(data: GenerateDiaryRequest): Promise<GenerateDiaryResponse> {
  return request.post('/diaries/generate', data);
}

// 保存日记
export function saveDiary(data: Partial<Diary>): Promise<Diary> {
  return request.post('/diaries', data);
}

// 获取日记列表（分页）
export function getDiaries(params?: {
  page?: number;
  size?: number;
  repositoryId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PageResult<Diary>> {
  return request.get('/diaries', { params });
}

// 获取日记详情
export function getDiary(id: number): Promise<Diary> {
  return request.get(`/diaries/${id}`);
}

// 更新日记
export function updateDiary(id: number, data: Partial<Diary>): Promise<Diary> {
  return request.put(`/diaries/${id}`, data);
}

// 删除日记
export function deleteDiary(id: number): Promise<void> {
  return request.delete(`/diaries/${id}`);
}

// 导出 Markdown
export function exportMarkdown(id: number): Promise<Blob> {
  return request.get(`/diaries/${id}/export/markdown`, { responseType: 'blob' });
}

// 创建分享链接
export function createShareLink(diaryId: number, expireDays: number = 7): Promise<ShareLink> {
  return request.post('/diaries/share', { diaryId, expireDays });
}

// 获取分享的日记（不需要登录）
export function getSharedDiary(token: string): Promise<Diary> {
  return request.get(`/share/${token}`);
}
