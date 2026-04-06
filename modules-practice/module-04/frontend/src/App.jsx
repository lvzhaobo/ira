import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Layout, Menu } from 'antd';
import {
  SettingOutlined,
  SendOutlined,
  HistoryOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import Rules from './pages/Rules';
import Dispatch from './pages/Dispatch';
import History from './pages/History';
import Channels from './pages/Channels';

const { Header, Content, Footer } = Layout;

/** 南方基金风格：深蓝主色 + 品牌红点缀 */
const nfTheme = {
  token: {
    colorPrimary: '#0B2F6F',
    colorError: '#C8102E',
    colorLink: '#0B4EA2',
    colorBgLayout: '#f0f4fa',
    borderRadius: 6,
    fontSize: 14,
  },
};

const menuItems = [
  { key: '/notify/rules', icon: <SettingOutlined />, label: '规则管理' },
  { key: '/notify/dispatch', icon: <SendOutlined />, label: '消息试发' },
  { key: '/notify/history', icon: <HistoryOutlined />, label: '投递历史' },
  { key: '/notify/channels', icon: <ApiOutlined />, label: '渠道配置' },
];

function Shell() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh', width: '100%', background: '#f0f4fa' }}>
      <Header
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'stretch',
          padding: 0,
          background: 'linear-gradient(90deg, #0B2F6F 0%, #0B4EA2 55%, #0B2F6F 100%)',
          borderBottom: '3px solid #C8102E',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 24,
            paddingRight: 32,
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          C-NotifyPush
          <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 14, opacity: 0.92 }}>
            多渠道推送 · M4 Sample
          </span>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            borderBottom: 'none',
            lineHeight: '64px',
          }}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: (
              <NavLink
                to={item.key}
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                {item.label}
              </NavLink>
            ),
          }))}
        />
      </Header>
      <Content
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '24px',
          background: '#f0f4fa',
        }}
      >
        <Routes>
          <Route path="/notify/rules" element={<Rules />} />
          <Route path="/notify/dispatch" element={<Dispatch />} />
          <Route path="/notify/history" element={<History />} />
          <Route path="/notify/channels" element={<Channels />} />
          <Route path="/" element={<Navigate to="/notify/rules" replace />} />
        </Routes>
      </Content>
      <Footer
        style={{
          width: '100%',
          textAlign: 'center',
          background: '#f0f4fa',
          color: 'rgba(11, 47, 111, 0.55)',
          borderTop: '1px solid rgba(11, 47, 111, 0.08)',
        }}
      >
        C-NotifyPush © 2026 · 合规与频控下的投研触达（Sample 可拆分为小组任务）
      </Footer>
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider theme={nfTheme}>
      <AntdApp>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
