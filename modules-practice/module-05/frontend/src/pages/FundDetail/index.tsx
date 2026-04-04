import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Spin, Button } from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { useFundStore } from '@/stores/fundStore';
import { useAnalysisStore } from '@/stores/analysisStore';

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
            <h2 style={{ margin: 0 }}>{currentFund.fundName}</h2>
            <p style={{ margin: '4px 0 0', color: '#666' }}>
              基金代码: {currentFund.fundCode}
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
        <Descriptions column={2} size="small">
          <Descriptions.Item label="基金类型">
            {currentFund.fundType}
          </Descriptions.Item>
          <Descriptions.Item label="最新净值">
            <span style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
              {currentFund.nav}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="净值日期">
            {currentFund.navDate}
          </Descriptions.Item>
          <Descriptions.Item label="日增长率">
            <span
              style={{
                color: currentFund.dailyGrowth >= 0 ? '#f5222d' : '#52c41a',
                fontWeight: 'bold',
              }}
            >
              {currentFund.dailyGrowth >= 0 ? '+' : ''}
              {currentFund.dailyGrowth}%
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="基金经理">
            {currentFund.manager}
          </Descriptions.Item>
          <Descriptions.Item label="基金公司">
            {currentFund.fundCompany}
          </Descriptions.Item>
          <Descriptions.Item label="基金规模">
            {currentFund.scale} 亿元
          </Descriptions.Item>
          <Descriptions.Item label="成立日期">
            {currentFund.成立Date}
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
