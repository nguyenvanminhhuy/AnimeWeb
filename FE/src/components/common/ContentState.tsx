import { Button } from '../ui/Button';
export function ContentState({
  title,
  description,
  retry,
}: {
  title: string;
  description: string;
  retry?: () => void;
}) {
  return (
    <div
      className="aw-state aw-surface tw:px-6 tw:py-16 tw:mx-auto tw:my-12 tw:rounded-2xl tw:text-center tw:max-w-210"
      role={retry ? 'alert' : 'status'}
    >
      <span className="aw-eyebrow">ANIME WEB</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {retry && <Button variant="primary" onClick={retry} label="Thử lại" />}
    </div>
  );
}
