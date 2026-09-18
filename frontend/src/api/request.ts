import axios from 'axios';
import { message } from 'antd';
import { storage } from '@/utils/storage';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：添加 JWT token
request.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果是二进制文件（导出），直接返回 Blob 数据
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    if (res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        storage.clear();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('没有权限');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status >= 500) {
        message.error('服务器错误，请稍后重试');
      } else {
        message.error(error.response.data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export default request;
