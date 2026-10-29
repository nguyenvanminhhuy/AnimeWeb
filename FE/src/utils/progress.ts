import type { Progress } from '@/types/progress';
export function isCompleted(progress: Progress) {
  return progress.completed === true || progress.positionSeconds >= progress.durationSeconds;
}
