export const userStatusLabels = { active: 'Đang hoạt động', blocked: 'Đã khoá' };
export const userStatusStyles = {
  active: 'tw:bg-[#9fe3c218] tw:text-[#9fe3c2]',
  blocked: 'tw:bg-[#edacbc18] tw:text-[#edacbc]',
};
const date = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});
export function userCreatedDate(value: string) {
  return date.format(new Date(value));
}
