import React, { useState, useEffect } from 'react';
import { App, Card, Form, Input, Select, Switch, Button, Space, Alert, Tag } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { dispatch, getChannels, getRules } from '../api/notify';

const Dispatch = () => {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const [rules, setRules] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ch, ru] = await Promise.all([getChannels(), getRules()]);
        setChannels(ch.data.items);
        setRules(ru.data.items);
      } catch {
        /* ignore */
      }
    };
    load();
  }, []);

  const runDispatch = async (values) => {
    setLoading(true);
    setResult(null);
    try {
      let variables = {};
      if (values.variables) {
        try {
          variables = JSON.parse(values.variables);
        } catch {
          message.error('模板变量不是合法 JSON');
          setLoading(false);
          return;
        }
      }
      const data = {
        payload: {
          title: values.title,
          body: values.body,
          variables,
        },
        dryRun: values.dryRun !== false,
      };
      if (values.ruleId) data.ruleId = values.ruleId;
      else data.channelIds = values.channelIds || [];
      if (values.sourceRef) data.sourceRef = values.sourceRef;

      const res = await dispatch(data);
      setResult(res.data);
      message.success(data.dryRun ? '试发已记录（dryRun）' : '已发起真实发送');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      message.error(`发送失败：${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (values.dryRun === false) {
      modal.confirm({
        title: '确认真实发送',
        content: '将关闭 dryRun 并可能访问外网渠道（若配置了 HTTP Webhook）。是否继续？',
        okText: '确认发送',
        okButtonProps: { danger: true },
        onOk: () => runDispatch(values),
      });
      return;
    }
    await runDispatch(values);
  };

  const list = result?.deliveries?.length
    ? result.deliveries
    : result?.delivery
      ? [result.delivery]
      : [];

  return (
    <div style={{ width: '100%' }}>
      <Card title="消息试发">
        <Alert
          message="安全默认"
          description="dryRun 默认为开启：不会请求外网渠道接口，仅写入投递记录。关闭 dryRun 前会二次确认；真发受服务端频控（Sample：30 次/小时）。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ dryRun: true }}
          style={{ maxWidth: 720 }}
        >
          <Form.Item name="ruleId" label="选择规则（与直选渠道二选一）">
            <Select
              allowClear
              placeholder="按规则携带的渠道与模板试发"
              onChange={(v) => {
                if (v) form.setFieldValue('channelIds', undefined);
              }}
            >
              {rules.map((rule) => (
                <Select.Option key={rule.ruleId} value={rule.ruleId}>
                  {rule.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="channelIds" label="目标渠道（与规则二选一）">
            <Select
              mode="multiple"
              placeholder="直发到所选渠道"
              onChange={(v) => {
                if (v && v.length) form.setFieldValue('ruleId', undefined);
              }}
            >
              {channels.map((ch) => (
                <Select.Option key={ch.channelId} value={ch.channelId}>
                  {ch.label}（{ch.type}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="消息标题" />
          </Form.Item>

          <Form.Item
            name="body"
            label="正文"
            rules={[{ required: true, message: '请输入正文' }]}
          >
            <Input.TextArea rows={6} placeholder="支持 Markdown；与规则模板联用时将注入 title/body 变量" />
          </Form.Item>

          <Form.Item name="variables" label="模板变量（JSON，可选）">
            <Input.TextArea rows={3} placeholder='例如 {"stock":"000001","change":"+2.5%"}' />
          </Form.Item>

          <Form.Item name="sourceRef" label="来源引用（可选，预留 M1 messageId）">
            <Input placeholder="sourceRef" />
          </Form.Item>

          <Form.Item name="dryRun" label="Dry Run（试发）" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} size="large">
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {result && (
          <Card title="响应摘要" style={{ marginTop: 24 }}>
            <Space wrap>
              <Tag color={result.dryRun ? 'blue' : 'red'}>{result.dryRun ? 'dryRun' : '真发'}</Tag>
              {result.delivery?.traceId && (
                <span style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  traceId: {result.delivery.traceId}
                </span>
              )}
            </Space>
            <div style={{ marginTop: 16 }}>
              {list.map((d) => (
                <div key={d.deliveryId || d.traceId} style={{ marginBottom: 8 }}>
                  <Tag>{d.channelId ? d.channelId.slice(0, 8) : '—'}</Tag>
                  <Tag color={d.status === 'sent' ? 'green' : d.status === 'failed' ? 'red' : 'default'}>
                    {d.status}
                  </Tag>
                  {d.traceId && (
                    <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{d.traceId}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default Dispatch;
