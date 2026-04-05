import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Spin, Button, Tag, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { useFundStore } from '@/stores/fundStore';
import { useAnalysisStore } from '@/stores/analysisStore';
import dayjs from 'dayjs';

const FundDetail: React.FC = () => {
  const { fundCode } = useParams<{ fundCode: string }>();
  const navigate = useNavigate();
  const { currentFund, isLoadingFund, loadFundDetail } = useFundStore();
  useAnalysisStore(); // 引入但不使用，留待后续扩展

  useEffect(() => {
    if (fundCode) {
      loadFundDetail(fundCode);
    }
  }, [fundCode, loadFundDetail]);

  const handleStartAnalysis = () => {
    if (currentFund && fundCode) {
      navigate(`/analysis/${fundCode}`);
    }
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      '股票型': 'blue',
      '混合型': 'green',
      '债券型': 'orange',
      '指数型': 'purple',
      'QDII': 'red',
    };
    return colorMap[type] || 'default';
  };

  const formatScale = (scale: number) => {
    if (!scale) return '-';
    const billion = scale / 100000000;
    return `${billion.toFixed(2)}亿元`;
  };

  if (isLoadingFund) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>加载中...</p>
      </div>
    );
  }

  if (!currentFund) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>未找到基金信息</p>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      <Card
        title={
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>{currentFund.name}</h2>
              <Tag color={getTypeColor(currentFund.fund_type)} style={{ fontSize: '14px' }}>
                {currentFund.fund_type}
              </Tag>
            </div>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
              基金代码: {currentFund.code}
            </p>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={handleStartAnalysis}
            size="large"
          >
            开始分析
          </Button>
        }
        style={{ marginBottom: '16px' }}
      >
        {/* 净值信息 */}
        {currentFund.latest_nav && (
          <Row gutter={16} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <Col span={6}>
              <Statistic
                title="最新净值"
                value={currentFund.latest_nav.nav}
                precision={4}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="累计净值"
                value={currentFund.latest_nav.accum_nav}
                precision={4}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="日收益率"
                value={currentFund.latest_nav.daily_return}
                precision={4}
                suffix="%"
                valueStyle={{ 
                  color: currentFund.latest_nav.daily_return >= 0 ? '#f5222d' : '#52c41a' 
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="净值日期"
                value={dayjs(currentFund.latest_nav.date).format('YYYY-MM-DD')}
              />
            </Col>
          </Row>
        )}

        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="基金类型">
            <Tag color={getTypeColor(currentFund.fund_type)}>
              {currentFund.fund_type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="基金经理">
            {currentFund.manager_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="基金规模">
            {formatScale(currentFund.scale || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="成立日期">
            {currentFund.establish_date ? dayjs(currentFund.establish_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={currentFund.status === 'active' ? 'green' : 'default'}>
              {currentFund.status === 'active' ? '运作中' : '已暂停'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {currentFund.updated_at ? dayjs(currentFund.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="快速操作">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button size="large" onClick={() => navigate(`/fund/${fundCode}/nav`)}>
            查看净值走势
          </Button>
          <Button size="large" onClick={() => navigate(`/fund/${fundCode}/holdings`)}>
            查看持仓详情
          </Button>
          <Button size="large" onClick={() => navigate(`/fund/${fundCode}/manager`)}>
            查看基金经理
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FundDetail;
