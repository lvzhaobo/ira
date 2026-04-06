import React, { useState, useEffect } from 'react';
import { App, Card, Table, Button, Space, Modal, Form, Input, Switch, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getRules, createRule, updateRule, deleteRule, getChannels, getTemplates } from '../api/notify';

const Rules = () => {
  const { message, modal } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [channels, setChannels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchChannels();
    fetchTemplates();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getRules();
      setData(res.data.items);
    } catch {
      message.error('获取规则列表失败');
    }
    setLoading(false);
  };

  const fetchChannels = async () => {
    try {
      const res = await getChannels();
      setChannels(res.data.items);
    } catch {
      /* ignore */
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await getTemplates();
      setTemplates(res.data.items);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true, triggerType: 'manual' });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRule(record);
    form.setFieldsValue({
      name: record.name,
      enabled: record.enabled,
      triggerType: record.triggerType,
      scheduleCron: record.scheduleCron,
      condition: JSON.stringify(record.condition || {}, null, 2),
      templateId: record.templateId || undefined,
      channelIds: record.channelIds,
    });
    setModalVisible(true);
  };

  const handleDelete = (ruleId) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除此规则吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRule(ruleId);
          message.success('删除成功');
          fetchData();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let condition = {};
      if (values.condition) {
        try {
          condition = JSON.parse(values.condition);
        } catch {
          message.error('触发条件不是合法 JSON');
          return;
        }
      }
      const payload = {
        name: values.name,
        enabled: values.enabled,
        triggerType: values.triggerType,
        scheduleCron: values.scheduleCron,
        templateId: values.templateId,
        channelIds: values.channelIds,
        condition,
      };

      if (editingRule) {
        await updateRule(editingRule.ruleId, payload);
        message.success('更新成功');
      } else {
        await createRule(payload);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchData();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '触发类型',
      dataIndex: 'triggerType',
      key: 'triggerType',
      render: (type) => {
        const map = { manual: '手动', schedule: '定时', event: '事件' };
        return map[type] || type;
      },
    },
    {
      title: '定时表达式',
      dataIndex: 'scheduleCron',
      key: 'scheduleCron',
      render: (cron) => cron || '—',
    },
    {
      title: '渠道数',
      dataIndex: 'channelIds',
      key: 'channelIds',
      render: (ids) => ids?.length ?? 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.ruleId)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Card
        title="规则管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="ruleId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ enabled: true, triggerType: 'manual' }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="triggerType"
            label="触发类型"
            rules={[{ required: true, message: '请选择触发类型' }]}
          >
            <Select>
              <Select.Option value="manual">手动</Select.Option>
              <Select.Option value="schedule">定时</Select.Option>
              <Select.Option value="event">事件（预留 M1/M2）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="scheduleCron" label="定时表达式（Cron）">
            <Input placeholder="例如 0 */2 * * *" />
          </Form.Item>

          <Form.Item name="templateId" label="消息模板">
            <Select allowClear placeholder="可选：绑定模板">
              {templates.map((tpl) => (
                <Select.Option key={tpl.templateId} value={tpl.templateId}>
                  {tpl.name}（{tpl.channelType}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="channelIds" label="目标渠道">
            <Select mode="multiple" placeholder="选择一个或多个渠道" optionFilterProp="children">
              {channels.map((ch) => (
                <Select.Option key={ch.channelId} value={ch.channelId}>
                  {ch.label}（{ch.type}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="condition" label="触发条件（JSON）">
            <Input.TextArea rows={4} placeholder='例如 {"keywords":[],"minSeverity":"high"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rules;
