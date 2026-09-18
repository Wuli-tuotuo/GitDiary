import { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Typography,
  Spin,
  Empty,
  Tag,
  List,
  Progress,
} from 'antd';
import {
  FileTextOutlined,
  CodeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { getRepositories } from '@/api/github';
import { getStats } from '@/api/stats';
import type { Repository, StatsData } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  const trendChartRef = useRef<HTMLDivElement>(null);
  const codeChartRef = useRef<HTMLDivElement>(null);
  const langChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedRepo, dateRange]);

  useEffect(() => {
    if (stats && !loading) {
      setTimeout(() => {
        renderCharts();
      }, 100);
    }
  }, [stats]);

  const loadRepositories = async () => {
    try {
      const data = await getRepositories();
      setRepositories(data);
    } catch (error) {
      console.error('加载仓库失败', error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedRepo) params.repositoryId = selectedRepo;
      if (dateRange && dateRange[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange && dateRange[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');

      const data = await getStats(params);
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    if (!stats) return;

    // 提交趋势图
    if (trendChartRef.current) {
      const chart = echarts.init(trendChartRef.current);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: stats.commitTrend.map((item) => item.date),
          axisLabel: { rotate: 45, fontSize: 10 },
        },
        yAxis: { type: 'value', name: '提交数' },
        series: [
          {
            name: '提交数',
            type: 'line',
            smooth: true,
            data: stats.commitTrend.map((item) => item.count),
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#1677ff' },
          },
        ],
      });
      window.addEventListener('resize', () => chart.resize());
    }

    // 代码变更图
    if (codeChartRef.current) {
      const chart = echarts.init(codeChartRef.current);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['增加行数', '删除行数'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: stats.codeChanges.map((item) => item.date),
          axisLabel: { rotate: 45, fontSize: 10 },
        },
        yAxis: { type: 'value', name: '行数' },
        series: [
          {
            name: '增加行数',
            type: 'bar',
            data: stats.codeChanges.map((item) => item.additions),
            itemStyle: { color: '#52c41a' },
          },
          {
            name: '删除行数',
            type: 'bar',
            data: stats.codeChanges.map((item) => item.deletions),
            itemStyle: { color: '#ff4d4f' },
          },
        ],
      });
      window.addEventListener('resize', () => chart.resize());
    }

    // 语言分布图
    if (langChartRef.current) {
      const chart = echarts.init(langChartRef.current);
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
          {
            name: '语言分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: stats.languageDistribution.map((item) => ({
              value: item.count,
              name: item.language,
            })),
          },
        ],
      });
      window.addEventListener('resize', () => chart.resize());
    }
  };

  const statCards = [
    { title: '日记总数', value: stats?.totalDiaries || 0, icon: <FileTextOutlined />, color: '#1677ff' },
    { title: '提交总数', value: stats?.totalCommits || 0, icon: <CodeOutlined />, color: '#52c41a' },
    { title: '增加行数', value: stats?.totalAdditions || 0, icon: <ArrowUpOutlined />, color: '#faad14' },
    { title: '删除行数', value: stats?.totalDeletions || 0, icon: <ArrowDownOutlined />, color: '#ff4d4f' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <BarChartOutlined /> 数据看板
        </Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            style={{ width: 200 }}
            placeholder="选择仓库"
            value={selectedRepo}
            onChange={setSelectedRepo}
            allowClear
            options={repositories.map((r) => ({ label: r.fullName, value: r.id }))}
          />
          <RangePicker
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
            allowClear
          />
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {statCards.map((stat, index) => (
            <Col span={6} key={index}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text type="secondary">{stat.title}</Text>
                    <Title level={2} style={{ margin: '4px 0 0', color: stat.color }}>
                      {stat.value.toLocaleString()}
                    </Title>
                  </div>
                  <div style={{ fontSize: 40, color: stat.color, opacity: 0.3 }}>{stat.icon}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={16}>
            <Card title="提交趋势">
              {stats && stats.commitTrend.length > 0 ? (
                <div ref={trendChartRef} style={{ height: 300 }} />
              ) : (
                <Empty description="暂无数据" style={{ padding: 48 }} />
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Card title="技术栈分布">
              {stats && stats.languageDistribution.length > 0 ? (
                <div ref={langChartRef} style={{ height: 300 }} />
              ) : (
                <Empty description="暂无数据" style={{ padding: 48 }} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="代码变更统计">
              {stats && stats.codeChanges.length > 0 ? (
                <div ref={codeChartRef} style={{ height: 300 }} />
              ) : (
                <Empty description="暂无数据" style={{ padding: 48 }} />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="高频知识点 Top 10">
              {stats && stats.topKnowledgePoints.length > 0 ? (
                <List
                  dataSource={stats.topKnowledgePoints}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color={index < 3 ? 'red' : 'blue'}>{index + 1}</Tag>}
                        title={item.name}
                        description={
                          <Progress
                            percent={Math.round((item.count / stats.topKnowledgePoints[0].count) * 100)}
                            size="small"
                            showInfo={false}
                          />
                        }
                      />
                      <Text strong>{item.count} 次</Text>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无知识点数据，生成日记后会自动统计" style={{ padding: 48 }} />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
