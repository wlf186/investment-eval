import httpx


class AsyncHttpClient:
    def __init__(self, timeout: float = 30.0):
        self.client = httpx.AsyncClient(timeout=timeout)

    async def get(self, url: str, **kwargs):
        response = await self.client.get(url, **kwargs)
        response.raise_for_status()
        return response

    async def post(self, url: str, **kwargs):
        response = await self.client.post(url, **kwargs)
        response.raise_for_status()
        return response

    async def close(self):
        await self.client.aclose()


http_client = AsyncHttpClient()
