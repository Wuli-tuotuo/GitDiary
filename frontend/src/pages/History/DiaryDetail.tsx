import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Spin,
  message,
  Input,
  Tag,
  Space,
  Divider,
  Popconfirm,
  Descriptions,
  Modal,
  InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  ShareAltOutlined,
  CopyOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getDiary, updateDiary, deleteDiary, exportMarkdown, createShareLink } from '@/api/diary';
import { getRepositories } from '@/api/github';
import type { Diary, KnowledgePoint, Repository, ShareLink } from '@/types';
import html2pdf from 'html2pdf.js';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function DiaryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diary, setDiary] = useState<Diary | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareExpireDays, setShareExpireDays] = useState(7);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  // 编辑状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);

  useEffect(() => {
    loadDiary();
    loadRepositories();
  }, [id]);

  const loadDiary = async () => {
    setLoading(true);
    try {
      const data = await getDiary(Number(id));
      setDiary(data);
      setTitle(data.title);
      setContent(data.content);
      setKnowledgePoints(data.knowledgePoints || []);
    } catch (error) {
      message.error('加载日记失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRepositories = async () => {
    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (error) {
      console.error('加载仓库失败', error);
    }
  };

  const getRepoName = (repoId: number) => {
    const repo = repositories.find((r) => r.id === repoId);
    return repo ? repo.fullName : `仓库 #${repoId}`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.error('标题不能为空');
      return;
    }
    setSaving(true);
    try {
      await updateDiary(Number(id), {
        repositoryId: diary!.repositoryId,
        title,
        content,
        knowledgePoints,
        startDate: diary!.startDate,
        endDate: diary!.endDate,
        commitCount: diary!.commitCount,
      });
      message.success('保存成功');
      setEditMode(false);
      loadDiary();
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDiary(Number(id));
      message.success('删除成功');
      navigate('/history');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const blob = await exportMarkdown(Number(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'diary'}.md`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('diary-content');
    if (!element) {
      message.error('找不到要导出的内容');
      return;
    }

    const opt = {
      margin: 10,
      filename: `${title || 'diary'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    html2pdf().set(opt).from(element).save();
    message.success('PDF 导出成功');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`# ${title}\n\n${content}`);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleShare = () => {
    setShareModalVisible(true);
    setShareLink(null);
  };

  const handleCreateShare = async () => {
    setShareLoading(true);
    try {
      const result = await createShareLink(Number(id), shareExpireDays);
      setShareLink(result);
      message.success('分享链接已生成');
    } catch (error) {
      message.error('生成分享链接失败');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      const url = `${window.location.origin}/share/${shareLink.token}`;
      navigator.clipboard.writeText(url);
      message.success('分享链接已复制');
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!diary) {
    return <div>日记不存在</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/history')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {editMode ? '编辑日记' : '日记详情'}
          </Title>
        </Space>
        <Space>
          {!editMode && (
            <>
              <Button icon={<EditOutlined />} onClick={() => setEditMode(true)}>
                编辑
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportMarkdown}>
                导出 MD
              </Button>
              <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                导出 PDF
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
              <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                分享
              </Button>
              <Popconfirm title="确定删除这篇日记吗？" onConfirm={handleDelete}>
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          {editMode && (
            <>
              <Button onClick={() => { setEditMode(false); loadDiary(); }}>
                取消
              </Button>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card>
        {!editMode ? (
          <div id="diary-content">
            <Descriptions column={3} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="仓库">
                <Tag color="blue">{getRepoName(diary.repositoryId)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="日期范围">
                {diary.startDate} ~ {diary.endDate}
              </Descriptions.Item>
              <Descriptions.Item label="提交次数">{diary.commitCount}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(diary.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(diary.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={4}>{diary.title}</Title>
            <div className="markdown-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {diary.content}
            </div>

            {knowledgePoints.length > 0 && (
              <>
                <Divider />
                <Title level={4}>涉及知识点</Title>
                {knowledgePoints.map((point, index) => (
                  <Card key={index} size="small" style={{ marginBottom: 12 }}>
                    <Space>
                      <Tag color="blue">{point.category || '其他'}</Tag>
                      <Text strong>{point.name}</Text>
                    </Space>
                    <div style={{ marginTop: 8, color: '#666' }}>{point.description}</div>
                  </Card>
                ))}
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>标题</Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>内容</Text>
              <TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                style={{ marginTop: 8, fontFamily: 'monospace' }}
              />
            </div>

            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text strong>知识点 ({knowledgePoints.length})</Text>
              <Button icon={<PlusOutlined />} onClick={addKnowledgePoint}>
                添加
              </Button>
            </div>
            {knowledgePoints.map((point, index) => (
              <Card key={index} size="small" style={{ marginBottom: 12 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="知识点名称"
                    value={point.name}
                    onChange={(e) => updateKnowledgePoint(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="分类"
                    value={point.category}
                    onChange={(e) => updateKnowledgePoint(index, 'category', e.target.value)}
                  />
                  <TextArea
                    placeholder="描述"
                    value={point.description}
                    onChange={(e) => updateKnowledgePoint(index, 'description', e.target.value)}
                    rows={2}
                  />
                  <Button danger size="small" onClick={() => removeKnowledgePoint(index)}>
                    删除此知识点
                  </Button>
                </Space>
              </Card>
            ))}
          </>
        )}
      </Card>

      <Modal
        title="分享日记"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setShareModalVisible(false)}>
            关闭
          </Button>,
          !shareLink && (
            <Button key="create" type="primary" loading={shareLoading} onClick={handleCreateShare}>
              生成分享链接
            </Button>
          ),
          shareLink && (
            <Button key="copy" type="primary" onClick={handleCopyShareLink}>
              复制链接
            </Button>
          ),
        ]}
      >
        {!shareLink ? (
          <div>
            <p>设置链接有效期：</p>
            <Space>
              <InputNumber
                min={1}
                max={365}
                value={shareExpireDays}
                onChange={(v) => setShareExpireDays(v || 7)}
                addonAfter="天"
              />
            </Space>
            <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
              生成的链接任何人都可以查看，无需登录。
            </p>
          </div>
        ) : (
          <div>
            <p>分享链接已生成（{shareExpireDays} 天后过期）：</p>
            <Input
              value={`${window.location.origin}/share/${shareLink.token}`}
              readOnly
              style={{ fontFamily: 'monospace' }}
            />
            <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
              访问次数：{shareLink.viewCount} 次
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
