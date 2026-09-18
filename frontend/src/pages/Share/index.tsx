import { useState, useEffect } from 'react';
import { Card, Typography, Spin, Tag, Descriptions, Divider, Empty, Button } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getSharedDiary } from '@/api/diary';
import type { Diary } from '@/types';

const { Title, Text } = Typography;

export default function Share() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedDiary();
  }, [token]);

  const loadSharedDiary = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setError('分享链接无效');
        return;
      }
      const data = await getSharedDiary(token);
      setDiary(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '分享链接不存在或已过期');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !diary) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <Empty description={error || '分享内容不存在'} />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: '#fff', marginBottom: 4 }}>
            <GithubOutlined /> GitDiary 分享
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>AI 生成的学习日记</Text>
        </div>

        <Card style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Descriptions column={2} style={{ marginBottom: 24 }} size="small">
            <Descriptions.Item label="日期范围">
              {diary.startDate} ~ {diary.endDate}
            </Descriptions.Item>
            <Descriptions.Item label="提交次数">{diary.commitCount}</Descriptions.Item>
            <Descriptions.Item label="生成时间">
              {dayjs(diary.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="浏览次数">
              <Tag color="blue">已分享</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={3} style={{ marginTop: 0 }}>{diary.title}</Title>

          <div className="markdown-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 15 }}>
            {diary.content}
          </div>

          {diary.knowledgePoints && diary.knowledgePoints.length > 0 && (
            <>
              <Divider />
              <Title level={4}>涉及知识点</Title>
              {diary.knowledgePoints.map((point, index) => (
                <Card key={index} size="small" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Tag color="blue">{point.category || '其他'}</Tag>
                    <Text strong>{point.name}</Text>
                  </div>
                  <div style={{ color: '#666', fontSize: 14 }}>{point.description}</div>
                </Card>
              ))}
            </>
          )}

          <Divider />
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>本文由 GitDiary AI 自动生成</p>
            <p>
              <Button type="link" size="small" onClick={() => navigate('/login')}>
                使用 GitDiary 生成你自己的学习日记
              </Button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
