import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Progress, Timeline, Tag, Space, Divider, Alert } from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined,
  RobotOutlined 
} from '@ant-design/icons';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useFundStore } from '@/stores/fundStore';
import type { AgentMessage } from '@/types/analysis';

const Analysis: React.FC = () => {
  const { fundCode } = useParams<{ fundCode: string }>();
  const navigate = useNavigate();
  const { currentTask, isAnalyzing, messages, startAnalysis, cancelTask } = useAnalysisStore();
  const { currentFund } = useFundStore();

  useEffect(() => {
    if (fundCode) {
      // 直接使用fundCode启动分析,不需要等待currentFund
      startAnalysis(fundCode, '');
    }
  }, [fundCode]);

  const handleCancel = () => {
    if (currentTask) {
      cancelTask(currentTask.id.toString());
      navigate(`/fund/${fundCode}`);
    }
  };

  const getAgentIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'thinking':
      case 'responding':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return <RobotOutlined />;
    }
  };

  const getAgentColor = (agentType: string) => {
    const colorMap: Record<string, string> = {
      'performance': 'blue',
      'risk': 'red',
      'holding': 'green',
      'manager': 'orange',
      'market': 'purple',
    };
    return colorMap[agentType] || 'default';
  };

  const getAgentName = (agentType: string) => {
    const nameMap: Record<string, string> = {
      'performance': '业绩分析Agent',
      'risk': '风险评估Agent',
      'holding': '持仓分析Agent',
      'manager': '经理评估Agent',
      'market': '市场分析Agent',
    };
    return nameMap[agentType] || agentType;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/fund/${fundCode}`)}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      <Card 
        title={
          <Space>
            <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span>多Agent智能分析</span>
          </Space>
        }
        extra={
          isAnalyzing ? (
            <Button danger onClick={handleCancel}>
              取消分析
            </Button>
          ) : (
            <Button onClick={() => navigate(`/fund/${fundCode}`)}>
              查看详情
            </Button>
          )
        }
      >
        {currentFund && (
          <Alert
            message={`正在分析: ${currentFund.name} (${currentFund.code})`}
            type="info"
            style={{ marginBottom: '24px' }}
          />
        )}

        {currentTask && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>分析进度</span>
                <span>{currentTask.progress}%</span>
              </div>
              <Progress 
                percent={currentTask.progress} 
                status={
                  currentTask.status === 'failed' ? 'exception' : 
                  currentTask.status === 'completed' ? 'success' : 
                  'active'
                }
              />
              <div style={{ marginTop: '8px', color: '#666' }}>
                状态: {
                  currentTask.status === 'pending' && '等待中'
                }
                {
                  currentTask.status === 'running' && `执行中 - ${currentTask.currentAgent}`
                }
                {
                  currentTask.status === 'completed' && '分析完成'
                }
                {
                  currentTask.status === 'failed' && '分析失败'
                }
              </div>
            </div>

            <Divider>Agent对话记录</Divider>

            <Timeline
              items={messages.map((msg: AgentMessage) => ({
                color: getAgentColor(msg.agentType),
                children: (
                  <Card 
                    size="small" 
                    style={{ marginBottom: '12px' }}
                    title={
                      <Space>
                        {getAgentIcon(msg.status)}
                        <Tag color={getAgentColor(msg.agentType)}>
                          {getAgentName(msg.agentType)}
                        </Tag>
                      </Space>
                    }
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                      {new Date(msg.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </Card>
                ),
              }))}
            />

            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                等待Agent开始分析...
              </div>
            )}
          </>
        )}

        {!currentTask && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <p style={{ marginTop: '16px' }}>正在初始化分析任务...</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Analysis;
