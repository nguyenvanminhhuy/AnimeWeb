export function moderationReasonError(reason: string) {
  const length = reason.trim().length;
  return length < 3 || length > 300 ? 'Nhập lý do từ 3 đến 300 ký tự.' : '';
}
