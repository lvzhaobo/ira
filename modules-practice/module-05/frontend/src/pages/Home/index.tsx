import React, { useEffect } from 'react';
import { Card, Input, List, Spin, Tag, Pagination } from 'antd';
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
    fundList,
    fundListTotal,
    fundListPage,
    fundListPageSize,
    isLoadingFundList,
    setSearchKeyword, 
    searchFunds,
    loadFundList
  } = useFundStore();

  // 页面加载时获取基金列表
  useEffect(() => {
    loadFundList(1, 20);
  }, [loadFundList]);

  const handleSearch = async (value: string) => {
    setSearchKeyword(value);
    if (value.trim()) {
      await searchFunds();
    }
  };

  const handleSelectFund = (fund: FundSearchResult) => {
    navigate(`/fund/${fund.code}`);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    loadFundList(page, pageSize);
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

      {/* 搜索结果 */}
      {searchKeyword && (
        <Card title="搜索结果" variant="borderless" style={{ marginBottom: '24px' }}>
          {isSearching ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <p style={{ marginTop: '16px' }}>搜索中...</p>
            </div>
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
                          {item.name}
                        </div>
                        <div style={{ color: '#666' }}>
                          基金代码: {item.code}
                        </div>
                      </div>
                      <Tag color={getTypeColor(item.fund_type)} style={{ fontSize: '14px' }}>
                        {item.fund_type}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              未找到相关基金
            </div>
          )}
        </Card>
      )}

      {/* 基金列表 */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>基金列表</span>
            <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>
              共 {fundListTotal} 只基金
            </span>
          </div>
        } 
        variant="borderless"
      >
        {isLoadingFundList ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>加载中...</p>
          </div>
        ) : fundList.length > 0 ? (
          <>
            <List
              dataSource={fundList}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '12px 16px',
                    transition: 'all 0.3s',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onClick={() => handleSelectFund(item)}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                            {item.code}
                          </span>
                          <span style={{ fontSize: '15px', color: '#333' }}>
                            {item.name}
                          </span>
                        </div>
                      </div>
                      <Tag color={getTypeColor(item.fund_type)} style={{ fontSize: '12px' }}>
                        {item.fund_type}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
            
            {/* 分页 */}
            {fundListTotal > fundListPageSize && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Pagination
                  current={fundListPage}
                  pageSize={fundListPageSize}
                  total={fundListTotal}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无基金数据
          </div>
        )}
      </Card>
    </div>
  );
};

export default Home;
