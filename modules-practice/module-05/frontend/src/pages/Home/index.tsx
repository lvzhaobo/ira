import React from 'react';
import { Card, Input, List, Spin, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useFundStore } from '@/stores/fundStore';
import type { FundSearchResult } from '@/types/fund';

const { Search } = Input;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { 
    searchKeyword, 
    searchResults, 
    isSearching, 
    setSearchKeyword, 
    searchFunds 
  } = useFundStore();

  const handleSearch = async (value: string) => {
    setSearchKeyword(value);
    await searchFunds();
  };

  const handleSelectFund = (fund: FundSearchResult) => {
    navigate(`/fund/${fund.fundCode}`);
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

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card
        title={
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '32px', color: '#1890ff' }}>
              多Agent基金投研平台
            </h1>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              智能分析 · 专业投研 · 科学决策
            </p>
          </div>
        }
        variant="borderless"
        style={{ marginBottom: '24px' }}
      >
        <Search
          placeholder="输入基金代码或基金名称进行搜索"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          loading={isSearching}
          style={{ maxWidth: '600px', display: 'block', margin: '0 auto' }}
        />
      </Card>

      <Card title="搜索结果" variant="borderless">
        {isSearching ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>搜索中...</p>
            </div>
          </Card>
        ) : searchResults.length > 0 ? (
          <List
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  padding: '16px',
                  transition: 'all 0.3s',
                }}
                onClick={() => handleSelectFund(item)}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {item.fundName}
                      </div>
                      <div style={{ color: '#666' }}>
                        基金代码: {item.fundCode}
                      </div>
                    </div>
                    <Tag color={getTypeColor(item.fundType)} style={{ fontSize: '14px' }}>
                      {item.fundType}
                    </Tag>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            {searchKeyword ? '未找到相关基金' : '请输入基金代码或名称开始搜索'}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Home;
