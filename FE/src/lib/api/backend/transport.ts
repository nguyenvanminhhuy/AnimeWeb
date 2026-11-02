import type { BackendTransport } from './client';
import { ApiError } from './error';

export const httpTransport: BackendTransport = async (request) => {
  let response: Response;
  try {
    response = await fetch(request.path, {
      method: request.method,
      headers: { Accept: 'application/json', ...request.headers },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: request.signal,
      credentials: request.credentials ?? 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    if (request.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError'))
      throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Không thể kết nối máy chủ. Kiểm tra BE và thử lại.');
  }
  if (response.status === 204) return { status: 204 };
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text) };
  } catch {
    if (!response.ok) return { status: response.status };
    throw new ApiError(
      502,
      'INVALID_API_RESPONSE',
      'Máy chủ trả dữ liệu không hợp lệ. Kiểm tra cấu hình proxy API.',
    );
  }
};
