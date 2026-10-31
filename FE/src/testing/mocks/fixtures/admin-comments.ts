import type { Comment } from '@/types/comment';
import { commentFixtures } from '@/testing/mocks/fixtures/comments';
import { anime } from '@/testing/mocks/fixtures/anime';

const films = anime.filter((item) => item.status !== 'upcoming');
const bodies = [
  'Mình thích cách câu chuyện mở đầu và giới thiệu các nhân vật.',
  'Âm nhạc ở đoạn cuối làm mình muốn xem lại tập này.',
  'Mong các nhân vật sẽ có thêm thời gian để hiểu nhau hơn.',
  'Phần <mở đầu> có nhiều chi tiết nhỏ rất dễ bỏ lỡ.',
  'Mình sẽ chờ phần tiếp theo rồi chia sẻ cảm nhận đầy đủ hơn.',
];
// Fictional moderation fixtures; never read the browser account/comment registries.
export const adminCommentFixtures: Comment[] = [
  ...structuredClone(commentFixtures),
  ...Array.from({ length: 20 }, (_, index): Comment => {
    const stamp = new Date(Date.UTC(2026, 9, 10 + index, 8)).toISOString();
    return {
      id: `admin-comment-${String(index + 1).padStart(2, '0')}`,
      animeId: films[index % films.length].id,
      userId: `comment-reader-${index + 1}`,
      authorName: `Bạn đọc ${String(index + 1).padStart(2, '0')}`,
      body: bodies[index % bodies.length],
      status: index % 4 === 0 ? 'hidden' : index % 4 === 1 ? 'deleted' : 'visible',
      createdAt: stamp,
      updatedAt: stamp,
    };
  }),
];
