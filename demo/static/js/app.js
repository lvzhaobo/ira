// Mock API基础URL
const API_BASE = '/mock-api';

// ============================================
// 工具函数
// ============================================

async function fetchData(endpoint) {
    const resultDiv = document.getElementById(endpoint + '-result');
    resultDiv.innerHTML = '<div class="loading"></div> 加载中...';
    resultDiv.classList.add('show');

    try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        const data = await response.json();
        
        resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">❌ 请求失败: ${error.message}</div>`;
    }
}

function showLoading(elementId) {
    const resultDiv = document.getElementById(elementId);
    resultDiv.innerHTML = '<div class="loading"></div> 加载中...';
    resultDiv.classList.add('show');
}

function showResult(elementId, data) {
    const resultDiv = document.getElementById(elementId);
    resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

function showError(elementId, message) {
    const resultDiv = document.getElementById(elementId);
    resultDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
}

// ============================================
// API调用函数
// ============================================

async function fetchStats() {
    const resultDiv = document.getElementById('stats-result');
    resultDiv.innerHTML = '<div class="loading"></div> 加载中...';
    resultDiv.classList.add('show');

    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        showResult('stats-result', data);
    } catch (error) {
        showError('stats-result', `请求失败: ${error.message}`);
    }
}

async function fetchUsers() {
    await fetchData('users');
}

async function fetchProducts() {
    await fetchData('products');
}

async function fetchOrders() {
    await fetchData('orders');
}

async function createOrder() {
    const resultDiv = document.getElementById('orders-result');
    resultDiv.innerHTML = '<div class="loading"></div> 创建中...';
    resultDiv.classList.add('show');

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        
        const existingContent = resultDiv.innerHTML.includes('<pre>') 
            ? resultDiv.innerHTML 
            : '';
        
        showResult('orders-result', {
            message: '✅ 订单创建成功',
            ...data
        });
    } catch (error) {
        showError('orders-result', `创建失败: ${error.message}`);
    }
}

async function testDelay() {
    const seconds = document.getElementById('delay-seconds').value;
    const resultDiv = document.getElementById('delay-result');
    resultDiv.innerHTML = `<div class="loading"></div> 模拟 ${seconds} 秒延迟...`;
    resultDiv.classList.add('show');

    const startTime = Date.now();

    try {
        const response = await fetch(`${API_BASE}/delay/${seconds}`);
        const data = await response.json();
        const endTime = Date.now();
        const actualDelay = ((endTime - startTime) / 1000).toFixed(2);
        
        resultDiv.innerHTML = `
            <div class="success">✅ 延迟测试完成</div>
            <pre>${JSON.stringify({
                ...data,
                actual_delay_seconds: parseFloat(actualDelay)
            }, null, 2)}</pre>
        `;
    } catch (error) {
        showError('delay-result', `测试失败: ${error.message}`);
    }
}

// ============================================
// 页面加载完成
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 IRA Demo loaded');
    console.log('📍 API Base URL:', API_BASE);
    
    // 自动获取统计数据
    fetchStats();
});
