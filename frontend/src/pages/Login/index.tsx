import { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, message } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getGithubAuthUrl } from '@/api/auth';
import { useAuth } from '@/store/AuthContext';

const { Title, Paragraph } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleGithubLogin = async () => {
    setLoading(true);
    try {
      const data = await getGithubAuthUrl();
      window.location.href = data.url;
    } catch (error) {
      message.error('获取授权链接失败');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1677ff' }}>
            <GithubOutlined /> GitDiary
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            AI 驱动的学习日记生成器
          </Paragraph>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button
            type="primary"
            size="large"
            block
            icon={<GithubOutlined />}
            loading={loading}
            onClick={handleGithubLogin}
            style={{ height: 48, fontSize: 16 }}
          >
            使用 GitHub 登录
          </Button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#999' }}>
            <p style={{ marginBottom: 4 }}>登录即表示同意我们的服务条款</p>
            <p>我们将读取你的公开仓库提交记录</p>
          </div>
        </Space>
      </Card>
    </div>
  );
}
