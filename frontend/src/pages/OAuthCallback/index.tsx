import { useEffect, useState } from 'react';
import { Spin, Typography, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { githubCallback } from '@/api/auth';
import { useAuth } from '@/store/AuthContext';

const { Title, Paragraph } = Typography;

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('GitHub 授权被拒绝');
      return;
    }

    if (!code) {
      setError('未获取到授权码');
      return;
    }

    const handleCallback = async () => {
      try {
        const response = await githubCallback(code);
        setAuth(response.token, response.user);
        message.success('登录成功');
        navigate('/dashboard');
      } catch (err) {
        setError('登录失败，请重试');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5',
      }}
    >
      {error ? (
        <>
          <Title level={3} type="danger">{error}</Title>
          <Paragraph type="secondary">
            3 秒后将跳转到登录页...
          </Paragraph>
          {setTimeout(() => navigate('/login'), 3000)}
        </>
      ) : (
        <>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24 }}>正在登录...</Title>
          <Paragraph type="secondary">请稍候，正在完成 GitHub 授权</Paragraph>
        </>
      )}
    </div>
  );
}
