import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

// 常见问题列表
const COMMON_QUESTIONS = [
  { category: '宏观', question: '当前货币政策对债市的影响？' },
  { category: '行业', question: '新能源车产业链最新动态' },
  { category: '合规', question: '研报中使用外部数据是否合规？' },
  { category: '策略', question: '当前市场环境下的大类资产配置建议' },
  { category: '风控', question: '如何识别信用债违约风险信号？' },
  { category: '个股', question: '贵州茅台 Q3 财报要点分析' },
];

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  // 切换会话时加载历史记录
  useEffect(() => {
    if (currentSession) {
      loadRecords(currentSession.session_id);
    }
  }, [currentSession]);

  const loadSessions = async () => {
    try {
      const sessionsData = await api.getSessions();
      setSessions(sessionsData);
      
      // 如果有会话，默认选中第一个
      if (sessionsData.length > 0 && !currentSession) {
        setCurrentSession(sessionsData[0]);
      }
    } catch (err) {
      console.error('加载会话失败:', err);
    }
  };

  const loadRecords = async (sessionId) => {
    try {
      const recordsData = await api.getRecords(sessionId);
      setRecords(recordsData);
    } catch (err) {
      console.error('加载记录失败:', err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSession = await api.createSession();
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setRecords([]);
    } catch (err) {
      console.error('创建会话失败:', err);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!confirm('确定删除此会话？')) return;
    
    try {
      await api.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      
      if (currentSession?.session_id === sessionId) {
        setCurrentSession(null);
        setRecords([]);
      }
    } catch (err) {
      console.error('删除会话失败:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.ask(input.trim(), currentSession.session_id);
      
      // 添加到记录
      setRecords([...records, {
        query: input.trim(),
        answer: result.answer,
        llm_used: result.llm_used,
        model: result.model,
        timestamp: new Date().toISOString(),
      }]);
      
      setInput('');
      
      // 刷新会话列表（更新标题）
      loadSessions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommonQuestion = (question) => {
    setInput(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      {/* 头部 */}
      <header className="header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            ☰
          </button>
          <h1>XX基金 · 投研助手 Agent</h1>
        </div>
        <div className="header-right">
          <button className="header-btn">设置</button>
        </div>
      </header>

      <div className="main-container">
        {/* 左侧会话列表 */}
        {sidebarVisible && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>历史会话</h2>
            </div>
            
            <button className="new-session-btn" onClick={handleCreateSession}>
              + 新建会话
            </button>

            <div className="session-list">
              {sessions.map(session => (
                <div
                  key={session.session_id}
                  className={`session-item ${currentSession?.session_id === session.session_id ? 'active' : ''}`}
                  onClick={() => setCurrentSession(session)}
                >
                  <div className="session-info">
                    <div className="session-title">{session.title}</div>
                    <div className="session-meta">
                      {session.query_count} 次问答
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* 右侧主内容 */}
        <main className="main-content">
          {!currentSession ? (
            <div className="empty-state">
              <p>请创建或选择一个会话开始</p>
            </div>
          ) : records.length === 0 ? (
            // 初始状态：显示常见问题
            <div className="common-questions">
              <h2>常见问题</h2>
              <div className="questions-grid">
                {COMMON_QUESTIONS.map((q, index) => (
                  <button
                    key={index}
                    className="question-btn"
                    onClick={() => handleCommonQuestion(q.question)}
                  >
                    <span className="question-category">{q.category}</span>
                    <span className="question-text">{q.question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 对话历史
            <div className="records-list">
              {records.map((record, index) => (
                <div key={index} className="record-card">
                  <div className="record-query">
                    <strong>Q:</strong> {record.query}
                  </div>
                  <div className="record-answer">
                    <strong>A:</strong> {record.answer}
                  </div>
                  <div className="record-meta">
                    <span className={`llm-tag ${record.llm_used ? 'llm-used' : 'llm-fallback'}`}>
                      {record.llm_used ? '百炼' : '降级'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 错误提示 */}
          {error && <div className="error-message">{error}</div>}

          {/* 输入区 */}
          <div className="input-area">
            <textarea
              className="query-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="请输入您的问题..."
              rows="3"
              disabled={loading || !currentSession}
            />
            <div className="input-actions">
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={loading || !input.trim() || !currentSession}
              >
                {loading ? '发送中...' : '发送'}
              </button>
              <button
                className="clear-btn"
                onClick={() => setInput('')}
                disabled={!input}
              >
                清空
              </button>
            </div>
            {loading && <div className="loading-bar">处理中...</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
