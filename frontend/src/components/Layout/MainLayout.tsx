import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Spin, message } from 'antd';
import {
  DashboardOutlined,
  FileAddOutlined,
  HistoryOutlined,
  GithubOutlined,
  LogoutOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/AuthContext';
import { getRepositories, syncRepositories } from '@/api/github';
import type { Repository } from '@/types';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (error) {
      console.error('加载仓库失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const data = await syncRepositories();
      setRepositories(data);
      message.success('仓库同步成功');
    } catch (error) {
      message.error('仓库同步失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    message.success('已退出登录');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/generate',
      icon: <FileAddOutlined />,
      label: '生成日记',
      onClick: () => navigate('/generate'),
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={240}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
            <GithubOutlined /> GitDiary
          </Title>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 8 }}
        />

        {!collapsed && (
          <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#666' }}>我的仓库</span>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleSync}
                loading={loading}
              />
            </div>
            <Spin spinning={loading}>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    style={{
                      padding: '6px 8px',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate(`/generate?repoId=${repo.id}`)}
                  >
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.name}
                    </div>
                    {repo.language && (
                      <div style={{ fontSize: 11, color: '#999' }}>{repo.language}</div>
                    )}
                  </div>
                ))}
                {repositories.length === 0 && !loading && (
                  <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 16 }}>
                    暂无仓库
                  </div>
                )}
              </div>
            </Spin>
          </div>
        )}
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={user?.avatarUrl} icon={<UserOutlined />} />
              <span>{user?.username}</span>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
