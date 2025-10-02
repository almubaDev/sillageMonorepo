export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiFetch<TResponse>(input: RequestInfo, init?: RequestInit): Promise<TResponse> {
  const request = new Request(input instanceof Request ? input : `${API_BASE_URL}${input}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const response = await fetch(request);

  if (!response.ok) {
    const errorBody = await safeJson(response);
    const error = new Error(errorBody?.detail ?? response.statusText);
    throw error;
  }

  return (await safeJson(response)) as TResponse;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
