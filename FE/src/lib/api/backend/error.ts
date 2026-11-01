export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
    public requestId?: string,
  ) {
    super(message);
  }
}
export function parseApiError(status: number, payload: unknown): ApiError {
  const envelope =
    payload && typeof payload === 'object' && 'error' in payload ? payload.error : null;
  const error =
    envelope && typeof envelope === 'object' ? (envelope as Record<string, unknown>) : {};
  const fields: Record<string, string> = {};
  if (error.fields && typeof error.fields === 'object')
    for (const [key, value] of Object.entries(error.fields)) {
      if (typeof value === 'string') fields[key] = value;
      else if (Array.isArray(value))
        fields[key] = value.filter((entry): entry is string => typeof entry === 'string').join(' ');
    }
  return new ApiError(
    status,
    typeof error.code === 'string' ? error.code : 'REQUEST_FAILED',
    typeof error.message === 'string' ? error.message : 'Không thể thực hiện yêu cầu.',
    fields,
    typeof error.requestId === 'string' ? error.requestId : undefined,
  );
}
export function assertVersion(current: number, expected: number) {
  if (!Number.isSafeInteger(expected) || current !== expected)
    throw new ApiError(
      409,
      'CONFLICT',
      'Dữ liệu đã thay đổi. Hãy làm mới và kiểm tra lại trước khi lưu.',
    );
}
