import type { Progress } from '@/types/progress';
export function isCompleted(progress: Progress) {
  return (
    progress.completed ??
    (progress.durationSeconds !== null &&
      progress.durationSeconds > 0 &&
      progress.positionSeconds >= progress.durationSeconds)
  );
}
