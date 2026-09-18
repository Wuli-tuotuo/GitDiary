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
  Checkbox,
  List,
  Badge,
} from 'antd';
import {
  ThunderboltOutlined,
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getRepositories } from '@/api/github';
import { generateDiary, saveDiary, getCommitFiles } from '@/api/diary';
import type { Repository, KnowledgePoint, GenerateDiaryResponse, CommitDTO, CommitFileDTO } from '@/types';

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

  // 两步流程：step 1=选择条件, step 2=选择文件, step 3=生成结果
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [commits, setCommits] = useState<CommitDTO[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [filesLoading, setFilesLoading] = useState(false);

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

  // 第一步：获取提交记录和文件列表
  const handleLoadCommits = async () => {
    try {
      const values = await form.validateFields();
      setFilesLoading(true);
      const data = await getCommitFiles({
        repositoryId: values.repositoryId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
      });
      setCommits(data);
      // 默认全选所有文件
      const allFiles = new Set<string>();
      data.forEach((commit) => {
        commit.files?.forEach((file) => {
          allFiles.add(file.filename);
        });
      });
      setSelectedFiles(allFiles);
      setStep(2);
      message.success(`获取到 ${data.length} 次提交，共 ${allFiles.size} 个变更文件`);
    } catch (error) {
      console.error('获取提交记录失败', error);
    } finally {
      setFilesLoading(false);
    }
  };

  // 切换文件选中状态
  const toggleFile = (filename: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(filename)) {
      newSet.delete(filename);
    } else {
      newSet.add(filename);
    }
    setSelectedFiles(newSet);
  };

  // 全选/取消全选
  const toggleAllFiles = (checkAll: boolean) => {
    if (checkAll) {
      const allFiles = new Set<string>();
      commits.forEach((commit) => {
        commit.files?.forEach((file) => {
          allFiles.add(file.filename);
        });
      });
      setSelectedFiles(allFiles);
    } else {
      setSelectedFiles(new Set());
    }
  };

  // 第二步：AI 生成日记
  const handleGenerate = async () => {
    if (selectedFiles.size === 0) {
      message.warning('请至少选择一个文件');
      return;
    }
    try {
      const values = form.getFieldsValue();
      setGenerating(true);
      setResult(null);

      const response = await generateDiary({
        repositoryId: values.repositoryId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        selectedFiles: Array.from(selectedFiles),
      });

      setResult(response);
      setTitle(response.title);
      setContent(response.content);
      setKnowledgePoints(response.knowledgePoints || []);
      setStep(3);
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

  // 收集所有文件并去重
  const allFiles = new Map<string, CommitFileDTO & { commitMessage: string }>();
  commits.forEach((commit) => {
    commit.files?.forEach((file) => {
      if (!allFiles.has(file.filename)) {
        allFiles.set(file.filename, {
          ...file,
          commitMessage: commit.commit?.message || '',
        });
      }
    });
  });

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>生成日记</Title>

      {/* 第一步：选择条件 */}
      <Card title="第一步：选择仓库和日期" style={{ marginBottom: 24 }}>
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
              icon={<FileOutlined />}
              loading={filesLoading}
              onClick={handleLoadCommits}
            >
              获取提交记录
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 第二步：选择文件 */}
      {step === 2 && (
        <Card
          title={
            <Space>
              <span>第二步：选择要分析的文件</span>
              <Badge count={selectedFiles.size} color="blue" />
              <Text type="secondary" style={{ fontSize: 14 }}>已选 {selectedFiles.size} / {allFiles.size} 个文件</Text>
            </Space>
          }
          extra={
            <Space>
              <Checkbox
                checked={selectedFiles.size === allFiles.size && allFiles.size > 0}
                onChange={(e) => toggleAllFiles(e.target.checked)}
              >
                全选
              </Checkbox>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={generating}
                onClick={handleGenerate}
                disabled={selectedFiles.size === 0}
              >
                AI 生成日记
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {generating ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin size="large" />
              <Title level={4} style={{ marginTop: 16 }}>AI 正在生成日记...</Title>
              <Text type="secondary">正在分析 {selectedFiles.size} 个文件的代码变更，请稍候</Text>
            </div>
          ) : (
            <>
              <Alert
                message={`共 ${commits.length} 次提交，${allFiles.size} 个变更文件。勾选你想让 AI 分析的文件，未选中的文件不会被分析。`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <List
                size="small"
                bordered
                dataSource={Array.from(allFiles.entries())}
                renderItem={([filename, file]) => {
                  const isChecked = selectedFiles.has(filename);
                  return (
                    <List.Item
                      style={{ cursor: 'pointer', opacity: isChecked ? 1 : 0.6 }}
                      onClick={() => toggleFile(filename)}
                    >
                      <Checkbox checked={isChecked} style={{ marginRight: 12 }} />
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontFamily: 'monospace' }}>{filename}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Space size="middle">
                            <Tag color="green">+{file.additions}</Tag>
                            <Tag color="red">-{file.deletions}</Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>{file.commitMessage}</Text>
                          </Space>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </>
          )}
        </Card>
      )}

      {/* 第三步：生成结果 */}
      {step === 3 && result && !generating && (
        <>
          <Card
            title="编辑日记"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setStep(2);
                    setResult(null);
                  }}
                >
                  重新选择文件
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

      {step === 1 && !filesLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <ThunderboltOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            <Title level={4} style={{ marginTop: 16 }}>选择仓库和日期范围，获取提交记录</Title>
            <Text type="secondary">先获取提交记录，然后你可以选择要分析的文件，AI 会根据你选择的文件生成学习日记</Text>
          </div>
        </Card>
      )}
    </div>
  );
}
