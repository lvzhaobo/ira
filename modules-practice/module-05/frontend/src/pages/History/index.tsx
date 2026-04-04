import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Space } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { HistoryRecord } from '@/types/analysis';
import type { ColumnsType } from 'antd/es/table';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { historyRecords, isLoadingHistory, loadHistory } = useAnalysisStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '等待中' },
      running: { color: 'processing', text: '执行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
    };
    const { color, text } = config[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const getDimensionTags = (dimensions: string[]) => {
    const colorMap: Record<string, string> = {
      performance: 'blue',
      risk: 'red',
      holding: 'green',
      manager: 'orange',
      market: 'purple',
    };
    const nameMap: Record<string, string> = {
      performance: '业绩',
      risk: '风险',
      holding: '持仓',
      manager: '经理',
      market: '市场',
    };

    return dimensions.map(dim => (
      <Tag key={dim} color={colorMap[dim]} style={{ margin: '2px' }}>
        {nameMap[dim] || dim}
      </Tag>
    ));
  };

  const columns: ColumnsType<HistoryRecord> = [
    {
      title: '基金代码',
      dataIndex: 'fundCode',
      key: 'fundCode',
      width: 120,
    },
    {
      title: '基金名称',
      dataIndex: 'fundName',
      key: 'fundName',
      width: 200,
    },
    {
      title: '分析维度',
      dataIndex: 'analysisType',
      key: 'analysisType',
      render: (dimensions: string[]) => getDimensionTags(dimensions),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 180,
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: HistoryRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/history/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card title="分析历史记录" variant="borderless">
        <Table
          columns={columns}
          dataSource={historyRecords}
          rowKey="id"
          loading={isLoadingHistory}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default History;
