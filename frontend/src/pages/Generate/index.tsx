import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Typography,
  Spin,
  message,
  Input,
  Tag,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  ThunderboltOutlined,
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getRepositories } from '@/api/github';
import { generateDiary, saveDiary } from '@/api/diary';
import type { Repository, KnowledgePoint, GenerateDiaryResponse } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function Generate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateDiaryResponse | null>(null);
  const [form] = Form.useForm();

  // 编辑状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);

  useEffect(() => {
    loadRepositories();
    const repoId = searchParams.get('repoId');
    if (repoId) {
      form.setFieldsValue({ repositoryId: Number(repoId) });
    }
    // 默认日期范围：最近7天
    const end = dayjs();
    const start = dayjs().subtract(6, 'day');
    form.setFieldsValue({ dateRange: [start, end] });
  }, []);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (error) {
      message.error('加载仓库列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setGenerating(true);
      setResult(null);

      const response = await generateDiary({
        repositoryId: values.repositoryId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
      });

      setResult(response);
      setTitle(response.title);
      setContent(response.content);
      setKnowledgePoints(response.knowledgePoints || []);
      message.success('日记生成成功');
    } catch (error) {
      console.error('生成日记失败', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.error('标题不能为空');
      return;
    }
    if (!content.trim()) {
      message.error('内容不能为空');
      return;
    }

    try {
      const values = form.getFieldsValue();
      await saveDiary({
        repositoryId: values.repositoryId,
        title,
        content,
        knowledgePoints,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        commitCount: result?.commitCount || 0,
      });
      message.success('日记保存成功');
      navigate('/history');
    } catch (error) {
      message.error('保存失败');
    }
  };

  const addKnowledgePoint = () => {
    setKnowledgePoints([...knowledgePoints, { name: '', description: '', category: '其他' }]);
  };

  const updateKnowledgePoint = (index: number, field: keyof KnowledgePoint, value: string) => {
    const updated = [...knowledgePoints];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledgePoints(updated);
  };

  const removeKnowledgePoint = (index: number) => {
    setKnowledgePoints(knowledgePoints.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>生成日记</Title>

      <Card title="选择条件" style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" style={{ rowGap: 16 }}>
          <Form.Item
            name="repositoryId"
            label="选择仓库"
            rules={[{ required: true, message: '请选择仓库' }]}
          >
            <Select
              style={{ width: 300 }}
              placeholder="请选择仓库"
              loading={loading}
              options={repositories.map((r) => ({ label: r.fullName, value: r.id }))}
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={generating}
              onClick={handleGenerate}
            >
              AI 生成日记
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {generating && (
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 16 }}>AI 正在生成日记...</Title>
            <Text type="secondary">正在分析代码提交记录和知识点，请稍候</Text>
          </div>
        </Card>
      )}

      {result && !generating && (
        <>
          <Card
            title="编辑日记"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleGenerate}>
                  重新生成
                </Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                  保存日记
                </Button>
              </Space>
            }
          >
            <Form layout="vertical">
              <Form.Item label="标题" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入日记标题" />
              </Form.Item>

              <Form.Item label="日记内容" required>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  placeholder="AI 生成的日记内容，可在此编辑"
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>
                  涉及知识点 ({knowledgePoints.length})
                </Title>
                <Button icon={<PlusOutlined />} onClick={addKnowledgePoint}>
                  添加知识点
                </Button>
              </div>

              {knowledgePoints.length === 0 ? (
                <Alert message="暂无知识点，点击上方按钮添加" type="info" showIcon />
              ) : (
                knowledgePoints.map((point, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      <Space>
                        <Tag color="blue">{point.category || '其他'}</Tag>
                        <span>知识点 {index + 1}</span>
                      </Space>
                    }
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeKnowledgePoint(index)}
                      />
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Input
                        placeholder="知识点名称"
                        value={point.name}
                        onChange={(e) => updateKnowledgePoint(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="分类（如：前端/后端/数据库/算法/工具）"
                        value={point.category}
                        onChange={(e) => updateKnowledgePoint(index, 'category', e.target.value)}
                      />
                      <TextArea
                        placeholder="知识点简要说明"
                        value={point.description}
                        onChange={(e) => updateKnowledgePoint(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </Space>
                  </Card>
                ))
              )}
            </Form>
          </Card>
        </>
      )}

      {!result && !generating && (
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <ThunderboltOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            <Title level={4} style={{ marginTop: 16 }}>选择仓库和日期范围，开始生成日记</Title>
            <Text type="secondary">AI 将自动分析代码提交记录，生成学习日记和知识点总结</Text>
          </div>
        </Card>
      )}
    </div>
  );
}
