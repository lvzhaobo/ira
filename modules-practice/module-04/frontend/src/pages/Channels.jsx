import React, { useState, useEffect } from 'react';
import {
  App,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Popconfirm,
  Alert,
  Typography,
} from 'antd';
import { PlusOutlined, ApiOutlined, ThunderboltOutlined, DeleteOutlined } from '@ant-design/icons';
import { getChannels, createChannel, testChannel, deleteChannel } from '../api/notify';

const { Paragraph, Text } = Typography;

const Channels = () => {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [testing, setTesting] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getChannels();
      setData(res.data.items);
    } catch {
      message.error('获取渠道列表失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let config = {};
      if (values.configText) {
        try {
          config = JSON.parse(values.configText);
        } catch {
          message.error('扩展配置不是合法 JSON');
          return;
        }
      }
      await createChannel({
        type: values.type,
        label: values.label,
        enabled: values.enabled,
        secretRef: values.secretRef,
        config,
      });
      message.success('创建成功');
      setModalVisible(false);
      fetchData();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('创建失败');
    }
  };

  /** 不访问外网，仅登记「最近测试」 */
  const handleQuickTest = async (record) => {
    setTesting(`${record.channelId}:quick`);
    try {
      const res = await testChannel(record.type, { channelId: record.channelId, realProbe: false });
      message.success(`快速校验完成，约 ${res.data.latencyMs} ms（${res.data.mode || 'mock'}）`);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error?.message || err.message);
    } finally {
      setTesting(null);
    }
  };

  /** 对钉钉/飞书 Webhook 发起真实 POST；邮件渠道会提示跳过 */
  const handleRealProbe = async (record) => {
    setTesting(`${record.channelId}:real`);
    try {
      const res = await testChannel(record.type, { channelId: record.channelId, realProbe: true });
      const { mode, hint, latencyMs } = res.data;
      if (mode === 'skipped') {
        message.warning(hint || '未执行外网探测');
      } else {
        message.success(`Webhook 探测成功，约 ${latencyMs} ms（${mode}）——请到钉钉/飞书查看测试消息`);
      }
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      message.error(msg);
      fetchData();
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (channelId) => {
    try {
      await deleteChannel(channelId);
      message.success('已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '展示名', dataIndex: 'label', key: 'label' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colorMap = { dingtalk: 'blue', feishu: 'cyan', email: 'orange' };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '最近测试',
      dataIndex: 'lastTestStatus',
      key: 'lastTestStatus',
      render: (status) => {
        if (!status) return <Tag>未测</Tag>;
        return <Tag color={status === 'ok' ? 'green' : 'red'}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_, record) => (
        <Space wrap size="small">
          <Button
            size="small"
            icon={<ApiOutlined />}
            loading={testing === `${record.channelId}:quick`}
            onClick={() => handleQuickTest(record)}
          >
            快速校验
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            loading={testing === `${record.channelId}:real`}
            onClick={() => handleRealProbe(record)}
          >
            探测 Webhook
          </Button>
          <Popconfirm title="删除渠道？" onConfirm={() => handleDelete(record.channelId)}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="钉钉能否真的连上？"
        description={
          <div>
            <Paragraph style={{ marginBottom: 8 }}>
              <Text strong>可以。</Text>
              在群内添加「自定义机器人」，将机器人给出的
              <Text code>Webhook 地址</Text>
              完整粘贴到下方「凭据 / Webhook」字段保存后，点
              <Text strong>「探测 Webhook」</Text>
              ，会向钉钉发一条测试文本；若群里出现消息，即表示网络与 token 可用。
            </Paragraph>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              你需要准备：
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                <li>
                  钉钉群 → 群设置 → 智能群助手 → 添加机器人 → 自定义 → 复制 Webhook（通常形如{' '}
                  <Text code>https://oapi.dingtalk.com/robot/send?access_token=...</Text>）
                </li>
                <li>
                  若机器人选择了「加签」安全设置，本 Sample 后端<Text strong>未实现加签算法</Text>
                  ，探测会失败；可临时关闭加签或使用「自定义关键词」等其它方式，或在组内任务中扩展签名逻辑。
                </li>
                <li>生产环境凭据应走密钥库 / secret_ref，勿把完整 URL 提交到公开仓库。</li>
              </ul>
            </Paragraph>
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              <Text type="secondary">快速校验：</Text>不访问外网，只更新「最近测试」状态，适合离线演示。
            </Paragraph>
          </div>
        }
      />

      <Card
        title="渠道配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建渠道
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="channelId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title="新建渠道"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="钉钉 Webhook 填在哪里？"
          description="将「secretRef / Webhook」填为机器人完整 URL。保存后使用「探测 Webhook」验证。"
        />
        <Form form={form} layout="vertical" initialValues={{ enabled: true }}>
          <Form.Item name="label" label="展示名" rules={[{ required: true, message: '请输入展示名' }]}>
            <Input placeholder="例如：投研钉钉群（沙箱）" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="渠道类型">
              <Select.Option value="dingtalk">钉钉</Select.Option>
              <Select.Option value="feishu">飞书</Select.Option>
              <Select.Option value="email">邮件</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="secretRef"
            label="凭据引用 / Webhook URL"
            rules={[{ required: true, message: '请填写 Webhook 或占位 secret-ref' }]}
            extra={
              <span style={{ fontSize: 12 }}>
                钉钉：粘贴机器人 Webhook 整行 URL。接口响应中不会回显该字段全文。
              </span>
            }
          >
            <Input.Password placeholder="https://oapi.dingtalk.com/robot/send?access_token=..." />
          </Form.Item>
          <Form.Item name="configText" label="扩展配置（JSON，可选）">
            <Input.TextArea rows={3} placeholder='{"remark":"内部备注"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Channels;
