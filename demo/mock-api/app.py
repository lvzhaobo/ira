from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)

# ============================================
# Mock数据
# ============================================

MOCK_USERS = [
    {"id": 1, "name": "张三", "email": "zhangsan@example.com", "role": "admin"},
    {"id": 2, "name": "李四", "email": "lisi@example.com", "role": "user"},
    {"id": 3, "name": "王五", "email": "wangwu@example.com", "role": "user"},
]

MOCK_PRODUCTS = [
    {"id": 1, "name": "产品A", "price": 99.99, "stock": 100},
    {"id": 2, "name": "产品B", "price": 199.99, "stock": 50},
    {"id": 3, "name": "产品C", "price": 299.99, "stock": 30},
]

MOCK_ORDERS = [
    {"id": 1001, "user_id": 1, "product_id": 1, "amount": 99.99, "status": "completed", "created_at": "2024-01-15T10:30:00Z"},
    {"id": 1002, "user_id": 2, "product_id": 2, "amount": 199.99, "status": "pending", "created_at": "2024-01-16T14:20:00Z"},
    {"id": 1003, "user_id": 1, "product_id": 3, "amount": 299.99, "status": "completed", "created_at": "2024-01-17T09:15:00Z"},
]

# ============================================
# API路由
# ============================================

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "mock-api"
    })

@app.route('/users', methods=['GET'])
def get_users():
    """获取用户列表"""
    return jsonify({
        "code": 200,
        "data": MOCK_USERS,
        "total": len(MOCK_USERS)
    })

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """获取单个用户"""
    user = next((u for u in MOCK_USERS if u['id'] == user_id), None)
    if user:
        return jsonify({"code": 200, "data": user})
    return jsonify({"code": 404, "message": "User not found"}), 404

@app.route('/products', methods=['GET'])
def get_products():
    """获取产品列表"""
    return jsonify({
        "code": 200,
        "data": MOCK_PRODUCTS,
        "total": len(MOCK_PRODUCTS)
    })

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """获取单个产品"""
    product = next((p for p in MOCK_PRODUCTS if p['id'] == product_id), None)
    if product:
        return jsonify({"code": 200, "data": product})
    return jsonify({"code": 404, "message": "Product not found"}), 404

@app.route('/orders', methods=['GET'])
def get_orders():
    """获取订单列表"""
    return jsonify({
        "code": 200,
        "data": MOCK_ORDERS,
        "total": len(MOCK_ORDERS)
    })

@app.route('/orders', methods=['POST'])
def create_order():
    """创建订单（模拟）"""
    new_order = {
        "id": random.randint(2000, 9999),
        "user_id": 1,
        "product_id": 1,
        "amount": 99.99,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    MOCK_ORDERS.append(new_order)
    return jsonify({"code": 201, "data": new_order}), 201

@app.route('/stats', methods=['GET'])
def get_stats():
    """获取统计数据"""
    return jsonify({
        "code": 200,
        "data": {
            "total_users": len(MOCK_USERS),
            "total_products": len(MOCK_PRODUCTS),
            "total_orders": len(MOCK_ORDERS),
            "completed_orders": len([o for o in MOCK_ORDERS if o['status'] == 'completed']),
            "pending_orders": len([o for o in MOCK_ORDERS if o['status'] == 'pending']),
            "timestamp": datetime.now().isoformat()
        }
    })

@app.route('/delay/<int:seconds>', methods=['GET'])
def delay_response(seconds):
    """模拟延迟响应（用于测试loading状态）"""
    import time
    time.sleep(min(seconds, 10))  # 最多延迟10秒
    return jsonify({
        "code": 200,
        "message": f"Delayed for {seconds} seconds",
        "timestamp": datetime.now().isoformat()
    })

# ============================================
# 启动服务
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Mock API Service Starting...")
    print("📍 URL: http://0.0.0.0:5001")
    print("📚 API Endpoints:")
    print("   GET  /health")
    print("   GET  /users")
    print("   GET  /users/<id>")
    print("   GET  /products")
    print("   GET  /products/<id>")
    print("   GET  /orders")
    print("   POST /orders")
    print("   GET  /stats")
    print("   GET  /delay/<seconds>")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
