/** Recheck the absolute deadline after each browser timer limit or delayed wake-up. */
export function scheduleDeadline(deadline: number, onExpired: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  function check() {
    const remaining = deadline - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) onExpired();
    else timer = setTimeout(check, Math.min(remaining, 2147483647));
  }
  check();
  return () => clearTimeout(timer);
}
