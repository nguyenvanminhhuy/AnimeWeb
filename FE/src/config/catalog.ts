export const genreOptions = [
  { value: 'adventure', label: 'Phiêu lưu' },
  { value: 'fantasy', label: 'Giả tưởng' },
  { value: 'action', label: 'Hành động' },
  { value: 'slice-of-life', label: 'Đời thường' },
  { value: 'romance', label: 'Tình cảm' },
] as const;
export const statusOptions = [
  { value: 'airing', label: 'Đang phát hành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'upcoming', label: 'Sắp ra mắt' },
] as const;
export const formatOptions = [
  { value: 'ova', label: 'OVA' },
  { value: 'ona', label: 'ONA' },
  { value: 'special', label: 'Đặc biệt' },
  { value: 'tv', label: 'TV series' },
  { value: 'movie', label: 'Điện ảnh' },
] as const;
export const catalogYears = [2026, 2025, 2024, 2023] as const;
export const sortOptions = [
  { value: 'newest', label: 'Năm phát hành mới nhất' },
  { value: 'title', label: 'Tên A–Z' },
] as const;

export const animeFormatLabel = (format: string) =>
  formatOptions.find((option) => option.value === format)?.label ?? format.toUpperCase();
