"""
CoPaw Agent 层
基于阿里云开源 CoPaw 框架的智能体封装
"""

import os
import time

import dashscope
from dashscope import Generation


class CoPawAgent:
    def __init__(self):
        self.api_key = os.getenv("BAILIAN_API_KEY")
        self.model = os.getenv("BAILIAN_MODEL", "qwen-max")
        self.timeout = int(os.getenv("BAILIAN_TIMEOUT", "8000"))  # 毫秒

        # 如果配置了 API Key，初始化 dashscope
        if self.api_key:
            dashscope.api_key = self.api_key

    def ask(self, query):
        """
        调用 Agent 处理用户问题

        返回:
        {
            'answer': str,
            'llm_used': bool,
            'model': str or None,
            'response_time_ms': int
        }
        """
        start_time = time.time()

        # 检查是否配置了百炼
        if not self.api_key:
            return self._fallback_response(time.time() - start_time)

        try:
            # 调用百炼 API
            response = Generation.call(model=self.model, prompt=query, timeout=self.timeout / 1000)  # 转换为秒

            response_time_ms = int((time.time() - start_time) * 1000)

            # 检查响应
            if response.status_code == 200:
                return {
                    "answer": response.output.text,
                    "llm_used": True,
                    "model": self.model,
                    "response_time_ms": response_time_ms,
                }
            else:
                # 百炼返回错误，降级
                return self._fallback_response(response_time_ms)

        except Exception as e:
            # 超时或其他异常，降级
            response_time_ms = int((time.time() - start_time) * 1000)
            return self._fallback_response(response_time_ms)

    def _fallback_response(self, response_time_ms):
        """降级回答"""
        return {
            "answer": "抱歉，智能服务暂时不可用，请稍后再试。如急需帮助，请联系投研支持团队。",
            "llm_used": False,
            "model": None,
            "response_time_ms": response_time_ms,
        }
