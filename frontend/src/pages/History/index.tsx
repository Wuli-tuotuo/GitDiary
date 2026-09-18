import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Popconfirm,
  message,
  Select,
  DatePicker,
  Input,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getDiaries, deleteDiary } from '@/api/diary';
import { getRepositories } from '@/api/github';
import type { Diary, Repository } from '@/types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function History() {
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filterRepo, setFilterRepo] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    loadDiaries();
  }, [page, pageSize, filterRepo, filterDate]);

  const loadRepositories = async () => {
    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (error) {
      console.error('加载仓库失败', error);
    }
  };

  const loadDiaries = async () => {
    setLoading(true);
    try {
      const params: any = { page: page - 1, size: pageSize };
      if (filterRepo) params.repositoryId = filterRepo;
      if (filterDate && filterDate[0]) params.startDate = filterDate[0].format('YYYY-MM-DD');
      if (filterDate && filterDate[1]) params.endDate = filterDate[1].format('YYYY-MM-DD');

      const data = await getDiaries(params);
      setDiaries(data.content || []);
      setTotal(data.totalElements || 0);
    } catch (error) {
      message.error('加载日记列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDiary(id);
      message.success('删除成功');
      loadDiaries();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getRepoName = (repoId: number) => {
    const repo = repositories.find((r) => r.id === repoId);
    return repo ? repo.fullName : `仓库 #${repoId}`;
  };

  const filteredDiaries = diaries.filter((d) => {
    if (!searchText) return true;
    return (
      d.title.toLowerCase().includes(searchText.toLowerCase()) ||
      d.content.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Diary) => (
        <a onClick={() => navigate(`/history/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '仓库',
      dataIndex: 'repositoryId',
      key: 'repositoryId',
      render: (repoId: number) => <Tag color="blue">{getRepoName(repoId)}</Tag>,
      width: 200,
    },
    {
      title: '日期范围',
      key: 'dateRange',
      render: (_: any, record: Diary) => (
        <span>
          {record.startDate} ~ {record.endDate}
        </span>
      ),
      width: 200,
    },
    {
      title: '提交数',
      dataIndex: 'commitCount',
      key: 'commitCount',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Diary) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/history/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/history/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除这篇日记吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>历史记录</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/generate')}>
          生成新日记
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索标题或内容"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="筛选仓库"
            value={filterRepo}
            onChange={setFilterRepo}
            style={{ width: 200 }}
            allowClear
            options={repositories.map((r) => ({ label: r.fullName, value: r.id }))}
          />
          <RangePicker
            value={filterDate as any}
            onChange={(dates) => setFilterDate(dates as any)}
            allowClear
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredDiaries}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 篇日记`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>
    </div>
  );
}
