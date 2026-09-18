// 用户信息
export interface User {
  id: number;
  githubId: number;
  username: string;
  avatarUrl: string;
  email?: string;
}

// GitHub 仓库
export interface Repository {
  id: number;
  githubId: number;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  private: boolean;
  htmlUrl: string;
  updatedAt: string;
}

// GitHub 提交记录
export interface Commit {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  date: string;
  htmlUrl: string;
  additions?: number;
  deletions?: number;
  files?: CommitFile[];
}

// 提交涉及的文件
export interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

// 知识点
export interface KnowledgePoint {
  name: string;
  description: string;
  category?: string;
}

// 日记
export interface Diary {
  id: number;
  userId: number;
  repositoryId: number;
  repositoryName?: string;
  title: string;
  content: string;
  knowledgePoints: KnowledgePoint[];
  startDate: string;
  endDate: string;
  commitCount: number;
  createdAt: string;
  updatedAt: string;
}

// 日记生成请求
export interface GenerateDiaryRequest {
  repositoryId: number;
  startDate: string;
  endDate: string;
}

// 日记生成响应
export interface GenerateDiaryResponse {
  title: string;
  content: string;
  knowledgePoints: KnowledgePoint[];
  commitCount: number;
}

// 分页响应
export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// 统计数据
export interface StatsData {
  commitTrend: { date: string; count: number }[];
  codeChanges: { date: string; additions: number; deletions: number }[];
  languageDistribution: { language: string; count: number }[];
  topKnowledgePoints: { name: string; count: number }[];
  totalDiaries: number;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
}

// 分享链接
export interface ShareLink {
  id: number;
  diaryId: number;
  token: string;
  expireAt: string;
  viewCount: number;
  createdAt: string;
}

// API 统一响应
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
