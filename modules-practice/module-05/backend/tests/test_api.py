"""基础API测试"""
import pytest
from app.models.fund import Fund, FundManager
from app.extensions import db
from datetime import date


class TestHealthCheck:
    """健康检查测试"""
    
    def test_health_check(self, client):
        """测试健康检查接口"""
        response = client.get('/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 0
        assert data['message'] == 'healthy'


class TestFundRoutes:
    """基金路由测试"""
    
    @pytest.fixture
    def sample_manager(self):
        """创建示例基金经理"""
        manager = FundManager(
            name='张三',
            gender='男',
            education='硕士',
            experience_years=10,
            biography='资深基金经理',
            start_date=date(2015, 1, 1),
            total_scale=1000000000,
            status='active'
        )
        db.session.add(manager)
        db.session.commit()
        return manager
    
    @pytest.fixture
    def sample_fund(self, sample_manager):
        """创建示例基金"""
        fund = Fund(
            code='000001',
            name='华夏成长混合',
            fund_type='混合型',
            manager_id=sample_manager.id,
            establish_date=date(2010, 1, 1),
            scale=5000000000,
            status='active'
        )
        db.session.add(fund)
        db.session.commit()
        return fund
    
    def test_search_funds(self, client, sample_fund):
        """测试基金搜索"""
        response = client.get('/api/fund/search')
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 0
        assert 'list' in data['data']
        assert 'total' in data['data']
    
    def test_search_funds_with_keyword(self, client, sample_fund):
        """测试带关键词的基金搜索"""
        response = client.get('/api/fund/search?keyword=000001')
        assert response.status_code == 200
        data = response.get_json()
        assert data['data']['total'] >= 1
    
    def test_get_fund_detail(self, client, sample_fund):
        """测试获取基金详情"""
        response = client.get('/api/fund/000001')
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 0
        assert data['data']['code'] == '000001'
        assert data['data']['name'] == '华夏成长混合'
    
    def test_get_fund_detail_not_found(self, client):
        """测试获取不存在的基金"""
        response = client.get('/api/fund/999999')
        assert response.status_code == 404


class TestAgentRoutes:
    """Agent路由测试"""
    
    def test_get_agent_types(self, client):
        """测试获取Agent类型列表"""
        response = client.get('/api/agent/types')
        assert response.status_code == 200
        data = response.get_json()
        assert data['code'] == 0
        assert len(data['data']) == 6  # 6种Agent


class TestAnalysisRoutes:
    """分析路由测试"""
    
    def test_start_analysis(self, client):
        """测试启动分析任务"""
        response = client.post('/api/analysis/start', json={
            'fund_code': '000001',
            'task_type': 'comprehensive'
        })
        # 由于没有实际的基金数据，会返回404或创建成功
        assert response.status_code in [201, 400, 404]
