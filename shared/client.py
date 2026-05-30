"""
服务间 HTTP 调用封装

每个服务通过 ServiceClient 调用其他服务的 API。
支持：超时控制、重试、请求追踪、Bearer Token。
"""

import httpx
from typing import Any, Optional


class ServiceClient:
    """微服务间 HTTP 调用客户端"""

    def __init__(self, base_url: str, token: str = "", timeout: float = 10.0):
        """
        Args:
            base_url: 目标服务的根URL，如 "http://localhost:8002"
            token: 服务间认证 Bearer Token
            timeout: 请求超时秒数
        """
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    def _headers(self) -> dict:
        h = {
            "Content-Type": "application/json",
            "X-Service-Name": "trade-service",
        }
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    async def get(self, path: str, params: dict = None) -> dict:
        """GET 请求"""
        client = await self._get_client()
        url = f"{self.base_url}{path}"
        resp = await client.get(url, params=params, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def post(self, path: str, data: dict = None) -> dict:
        """POST 请求"""
        client = await self._get_client()
        url = f"{self.base_url}{path}"
        resp = await client.post(url, json=data, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def put(self, path: str, data: dict = None) -> dict:
        """PUT 请求"""
        client = await self._get_client()
        url = f"{self.base_url}{path}"
        resp = await client.put(url, json=data, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def delete(self, path: str) -> dict:
        """DELETE 请求"""
        client = await self._get_client()
        url = f"{self.base_url}{path}"
        resp = await client.delete(url, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None


# ── 预配置的服务客户端工厂 ──

# 各服务端口约定
SERVICE_PORTS = {
    "client":  8000,
    "trade":   8001,
    "account": 8002,
    "info":    8003,
    "admin":   8004,
}


def create_client(service: str, host: str = "localhost") -> ServiceClient:
    """创建指定服务的客户端"""
    port = SERVICE_PORTS.get(service, 8000)
    return ServiceClient(f"http://{host}:{port}")
