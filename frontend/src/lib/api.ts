// Use relative paths so Next.js rewrite proxy handles API routing
// This works for both localhost and remote IP access
const API_BASE = "";

export async function fetchAPI(path: string, options?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
