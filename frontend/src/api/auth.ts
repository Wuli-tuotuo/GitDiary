import request from './request';
import type { User } from '@/types';

// 获取 GitHub 授权 URL
export function getGithubAuthUrl(): Promise<{ url: string }> {
  return request.get('/auth/github/url');
}

// GitHub OAuth 回调，用 code 换 token
export function githubCallback(code: string): Promise<{ token: string; user: User }> {
  return request.get('/auth/github/callback', { params: { code } });
}

// 获取当前用户信息
export function getCurrentUser(): Promise<User> {
  return request.get('/auth/user');
}

// 退出登录
export function logout(): Promise<void> {
  return request.post('/auth/logout');
}
