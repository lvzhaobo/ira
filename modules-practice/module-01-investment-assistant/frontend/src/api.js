/**
 * API 客户端
 */

const API_BASE = '/api/v1/agent';

export const api = {
  /**
   * 提问
   */
  async ask(query, sessionId) {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        session_id: sessionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || '请求失败');
    }

    return data;
  },

  /**
   * 获取会话列表
   */
  async getSessions() {
    const response = await fetch(`${API_BASE}/sessions`);
    const data = await response.json();
    return data.sessions;
  },

  /**
   * 创建会话
   */
  async createSession(title = '新会话') {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    return await response.json();
  },

  /**
   * 删除会话
   */
  async deleteSession(sessionId) {
    await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * 获取会话问答历史
   */
  async getRecords(sessionId) {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/records`);
    const data = await response.json();
    return data.records;
  },
};
