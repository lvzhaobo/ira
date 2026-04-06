import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Select, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getDeliveries, getChannels, getRules } from '../api/notify';

const History = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const [rules, setRules] = useState([]);
  const [filters, setFilters] = useState({
    ruleId: undefined,
    status: undefined,
    channelId: undefined,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [ch, ru] = await Promise.all([getChannels(), getRules()]);
        setChannels(ch.data.items);
        setRules(ru.data.items);
      } catch {
        /* ignore */
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.ruleId) params.ruleId = filters.ruleId;
        if (filters.status) params.status = filters.status;
        if (filters.channelId) params.channelId = filters.channelId;
        const res = await getDeliveries(params);
        setData(res.data.items);
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    run();
  }, [filters, tick]);

  const handleReset = () => {
    setFilters({ ruleId: undefined, status: undefined, channelId: undefined });
  };

  const statusColorMap = {
    sent: 'green',
    pending: 'orange',
    failed: 'red',
    blocked: 'volcano',
  };

  const columns = [
    {
      title: '投递 ID',
      dataIndex: 'deliveryId',
      key: 'deliveryId',
      width: 280,
      ellipsis: true,
      render: (id) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{id}</span>,
    },
    {
      title: '规则',
      dataIndex: 'ruleId',
      key: 'ruleId',
      render: (ruleId) => {
        const rule = rules.find((r) => r.ruleId === ruleId);
        return rule ? rule.name : '—';
      },
    },
    {
      title: '渠道',
      dataIndex: 'channelId',
      key: 'channelId',
      render: (channelId) => {
        const channel = channels.find((c) => c.channelId === channelId);
        return channel ? `${channel.label}（${channel.type}）` : channelId;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>,
    },
    {
      title: '模式',
      dataIndex: 'dryRun',
      key: 'dryRun',
      render: (dryRun) => (
        <Tag color={dryRun ? 'blue' : 'red'}>{dryRun ? 'dryRun' : '真发'}</Tag>
      ),
    },
    {
      title: 'Trace',
      dataIndex: 'traceId',
      key: 'traceId',
      width: 280,
      ellipsis: true,
      render: (id) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{id}</span>,
    },
    {
      title: '预览',
      dataIndex: 'payloadPreview',
      key: 'payloadPreview',
      ellipsis: true,
      render: (preview) => preview || '—',
    },
    {
      title: '错误码',
      dataIndex: 'errorCode',
      key: 'errorCode',
      render: (code) => code || '—',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Card
        title="投递历史"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => setTick((n) => n + 1)}>
            刷新
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="规则"
            style={{ width: 200 }}
            value={filters.ruleId}
            onChange={(v) => setFilters({ ...filters, ruleId: v })}
          >
            {rules.map((rule) => (
              <Select.Option key={rule.ruleId} value={rule.ruleId}>
                {rule.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="渠道"
            style={{ width: 200 }}
            value={filters.channelId}
            onChange={(v) => setFilters({ ...filters, channelId: v })}
          >
            {channels.map((ch) => (
              <Select.Option key={ch.channelId} value={ch.channelId}>
                {ch.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 140 }}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="sent">sent</Select.Option>
            <Select.Option value="pending">pending</Select.Option>
            <Select.Option value="failed">failed</Select.Option>
            <Select.Option value="blocked">blocked</Select.Option>
          </Select>
          <Button onClick={handleReset}>重置</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="deliveryId"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1600 }}
        />
      </Card>
    </div>
  );
};

export default History;
