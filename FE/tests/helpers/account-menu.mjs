export async function logoutFromMenu(page) {
  const logout = page.getByRole('button', { name: 'Đăng xuất', exact: true });
  if (!(await logout.isVisible()))
    await page.getByRole('button', { name: /^Tài khoản của / }).click();
  await logout.click();
}
