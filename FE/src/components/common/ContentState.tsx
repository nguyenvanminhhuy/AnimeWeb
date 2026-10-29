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
    <div className="aw-state aw-surface" role={retry ? 'alert' : 'status'}>
      <span className="aw-eyebrow">ANIME WEB</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {retry && (
        <button className="btn aw-btn-primary" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
