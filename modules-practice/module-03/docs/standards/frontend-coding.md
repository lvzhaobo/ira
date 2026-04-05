# 前端开发规范

> **版本**: v1.0  
> **技术栈**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5  
> **适用范围**: 本项目所有前端代码

---

## 1. 项目结构

```
frontend/
├── index.html           # 主页面
├── README.md            # 使用说明
├── .env.example         # 环境变量示例
└── assets/              # 静态资源(可选)
    ├── css/
    ├── js/
    └── images/
```

**注意**: 当前使用原生 HTML,如升级为 React/Vue,结构调整见附录 A。

---

## 2. HTML 规范

### 2.1 文档结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题</title>
  <!-- CSS -->
</head>
<body>
  <!-- 内容 -->
  
  <!-- JavaScript -->
  <script src="app.js"></script>
</body>
</html>
```

### 2.2 语义化标签
```html
<!-- ✅ 推荐 -->
<header>
  <h1>知识库系统</h1>
</header>

<main>
  <section>
    <h2>文档列表</h2>
    <div id="documentList"></div>
  </section>
</main>

<footer>
  <p>&copy; 2026</p>
</footer>

<!-- ❌ 避免 -->
<div class="header">
  <div class="title">知识库系统</div>
</div>
```

### 2.3 属性规范
- 使用双引号: `<div class="container">`
- 布尔属性不加值: `<input disabled>`
- 自定义数据属性: `data-doc-id="doc-001"`

---

## 3. CSS 规范

### 3.1 命名规范
```css
/* ✅ BEM 命名 */
.document-list { }
.document-list__item { }
.document-list__item--active { }

/* ❌ 避免 */
.docList { }
.item1 { }
```

### 3.2 选择器优先级
```css
/* ✅ 低优先级,易维护 */
.btn { }
.btn-primary { }

/* ❌ 高优先级,难覆盖 */
#main .content div.btn { }
```

### 3.3 响应式设计
```css
/* 移动优先 */
.container {
  width: 100%;
  padding: 0 12px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
    margin: 0 auto;
  }
}

/* 桌面 */
@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
}
```

### 3.4 使用 CSS 框架
```html
<!-- Bootstrap 5 CDN -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
```

**规则:**
- 优先使用框架类名
- 自定义 CSS 仅用于特殊需求
- 不修改框架源码

---

## 4. JavaScript 规范

### 4.1 变量声明
```javascript
// ✅ 使用 const/let
const baseUrl = 'http://localhost:8000';
let isLoading = false;

// ❌ 避免 var
var baseUrl = 'http://localhost:8000';
```

### 4.2 函数定义
```javascript
// ✅ 箭头函数
const apiCall = async (path, options = {}) => {
  // ...
};

// ✅ 命名函数
function displayAnswer(data) {
  // ...
}

// ❌ 避免
var apiCall = function(path, options) {
  // ...
};
```

### 4.3 异步处理
```javascript
// ✅ async/await
async function submitQuestion() {
  try {
    const data = await apiCall('/research/qa/ask', {
      method: 'POST',
      body: JSON.stringify({ query: question })
    });
    displayAnswer(data);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

// ❌ 避免回调地狱
apiCall('/ask', function(err, data) {
  if (err) {
    // ...
  } else {
    // ...
  }
});
```

### 4.4 错误处理
```javascript
// ✅ 统一错误处理
async function apiCall(path, options = {}) {
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}

// ✅ 用户友好的错误提示
function showError(message) {
  showToast('error', message);
}
```

---

## 5. API 调用规范

### 5.1 封装 Fetch
```javascript
const API_BASE = localStorage.getItem('BFF_BASE_URL') || 'http://localhost:8000';

async function apiCall(path, options = {}) {
  const url = `${API_BASE}/api/v1${path}`;
  
  const defaultOptions = {
    headers: {
      'Accept': 'application/json',
    }
  };
  
  if (!(options.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }
  
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  const response = await fetch(url, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data;
}
```

### 5.2 调用示例
```javascript
// GET 请求
async function refreshDocumentList() {
  const data = await apiCall('/kb/documents');
  renderDocumentList(data.items);
}

// POST 请求(JSON)
async function submitQuestion(query) {
  const data = await apiCall('/research/qa/ask', {
    method: 'POST',
    body: JSON.stringify({
      query: query,
      session_id: null,
      spec_version: null
    })
  });
  displayAnswer(data);
}

// POST 请求(FormData)
async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', file.name);
  
  const data = await apiCall('/research/qa/upload', {
    method: 'POST',
    body: formData
  });
  return data;
}
```

---

## 6. UI 组件规范

### 6.1 Toast 通知
```javascript
function showToast(type, message) {
  const toastId = type === 'success' ? 'toastSuccess' : 'toastError';
  const toastBodyId = type === 'success' ? 'toastSuccessBody' : 'toastErrorBody';
  
  document.getElementById(toastBodyId).textContent = message;
  const toast = new bootstrap.Toast(document.getElementById(toastId));
  toast.show();
}

// 使用
showToast('success', '上传成功!');
showToast('error', '上传失败: 文件过大');
```

### 6.2 加载状态
```javascript
function setLoading(buttonId, loading) {
  const btn = document.getElementById(buttonId);
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = '加载中...';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || '提交';
  }
}

// 使用
setLoading('askBtn', true);
try {
  await submitQuestion(query);
} finally {
  setLoading('askBtn', false);
}
```

### 6.3 空状态
```javascript
function renderEmptyState(containerId, message) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="text-center text-muted py-4">
      <p>${message}</p>
    </div>
  `;
}

// 使用
if (items.length === 0) {
  renderEmptyState('documentList', '暂无文档,请上传');
}
```

---

## 7. 安全规范

### 7.1 XSS 防护
```javascript
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ✅ 使用转义
document.getElementById('title').innerHTML = escapeHtml(doc.title);

// ❌ 直接插入
document.getElementById('title').innerHTML = doc.title;
```

### 7.2 敏感信息
```javascript
// ✅ 从环境变量读取
const API_BASE = localStorage.getItem('BFF_BASE_URL');

// ❌ 硬编码
const API_BASE = 'http://production-server.com';

// ❌ 在代码中存储密钥
const API_KEY = 'sk-1234567890';
```

---

## 8. 性能优化

### 8.1 防抖
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 使用: 搜索输入框
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce((e) => {
  searchDocuments(e.target.value);
}, 300));
```

### 8.2 懒加载
```javascript
// 图片懒加载
<img data-src="image.jpg" class="lazy-load" alt="...">

<script>
const lazyImages = document.querySelectorAll('.lazy-load');
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy-load');
      observer.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));
</script>
```

---

## 9. 可访问性(A11y)

### 9.1 语义化
```html
<!-- ✅ 正确 -->
<button onclick="submit()">提交</button>
<a href="/docs">文档</a>

<!-- ❌ 避免 -->
<div onclick="submit()">提交</div>
<span onclick="location.href='/docs'">文档</span>
```

### 9.2 ARIA 属性
```html
<div role="alert" aria-live="polite" id="errorMessage">
  上传失败
</div>

<button aria-label="关闭" onclick="closeModal()">
  &times;
</button>
```

### 9.3 键盘导航
```javascript
// 确保所有交互元素可通过 Tab 访问
// 提供可见的 focus 样式
button:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}
```

---

## 10. 浏览器兼容

### 10.1 目标浏览器
- Chrome (最新 2 个版本)
- Firefox (最新 2 个版本)
- Safari (最新 2 个版本)
- Edge (最新 2 个版本)

### 10.2 Polyfill
如需支持旧浏览器,引入 polyfill:
```html
<script src="https://polyfill.io/v3/polyfill.min.js"></script>
```

---

## 11. 测试规范

### 11.1 手动测试清单
- [ ] 页面在所有目标浏览器正常显示
- [ ] 响应式布局在不同屏幕尺寸正常
- [ ] 所有按钮点击有反馈
- [ ] 表单验证正常工作
- [ ] 错误提示友好
- [ ] 加载状态清晰
- [ ] 无控制台错误

### 11.2 自动化测试(可选)
```javascript
// 使用 Playwright 进行 E2E 测试
test('上传文档并查询', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 上传文档
  await page.setInputFiles('#fileInput', 'test.pdf');
  await page.click('#uploadBtn');
  
  // 等待上传完成
  await page.waitForSelector('.toast-success');
  
  // 提问
  await page.fill('#questionInput', '测试问题');
  await page.click('#askBtn');
  
  // 验证回答
  await page.waitForSelector('#answerDisplay');
});
```

---

## 12. 检查清单

提交代码前自查:

- [ ] HTML 语义化正确
- [ ] CSS 命名规范(BEM)
- [ ] JavaScript 使用 const/let
- [ ] 异步操作有错误处理
- [ ] 用户输入已转义(XSS 防护)
- [ ] 无硬编码配置
- [ ] 响应式布局正常
- [ ] 加载状态清晰
- [ ] 错误提示友好
- [ ] 通过手动测试清单

---

## 附录 A: React 版本规范(可选)

如升级为 React,遵循以下额外规范:

### A.1 组件结构
```
src/
├── components/
│   ├── DocumentList/
│   │   ├── index.jsx
│   │   ├── DocumentList.jsx
│   │   └── DocumentList.css
│   └── QuestionInput/
│       ├── index.jsx
│       └── QuestionInput.jsx
├── hooks/
│   └── useApi.js
├── services/
│   └── api.js
└── App.jsx
```

### A.2 Hooks 规范
```jsx
// ✅ 自定义 Hook 封装 API
function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const call = async (path, options) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(path, options);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { call, loading, error };
}
```

### A.3 状态管理
- 简单状态: `useState`
- 跨组件状态: `Context API`
- 复杂状态: `Zustand` 或 `Redux Toolkit`
