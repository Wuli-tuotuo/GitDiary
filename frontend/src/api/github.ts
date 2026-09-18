import request from './request';
import type { Repository, Commit } from '@/types';

// 同步 GitHub 仓库列表
export function syncRepositories(): Promise<Repository[]> {
  return request.post('/github/repositories/sync');
}

// 获取用户仓库列表
export function getRepositories(): Promise<Repository[]> {
  return request.get('/github/repositories');
}

// 获取仓库提交记录
export function getCommits(
  repositoryId: number,
  params?: { startDate?: string; endDate?: string; page?: number; size?: number }
): Promise<{ content: Commit[]; totalElements: number }> {
  return request.get(`/github/repositories/${repositoryId}/commits`, { params });
}

// 获取提交详情（含 diff）
export function getCommitDetail(repositoryId: number, sha: string): Promise<Commit> {
  return request.get(`/github/repositories/${repositoryId}/commits/${sha}`);
}
