export default function Timeline({ steps }) {
  if (!steps?.length) return null;

  return (
    <ol className="timeline">
      {steps.map((step, index) => (
        <li key={step.id} className={`timeline-item ${step.done ? 'done' : ''} ${step.error ? 'error' : ''}`}>
          <div className="timeline-dot" />
          <div className="timeline-body">
            <strong>{step.label}</strong>
            {step.at && (
              <span className="timeline-time">
                {new Date(step.at).toLocaleString('fr-CA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          {index < steps.length - 1 && <div className="timeline-line" />}
        </li>
      ))}
      <style>{`
        .timeline {
          list-style: none;
          position: relative;
          padding-left: 8px;
        }
        .timeline-item {
          position: relative;
          padding-left: 28px;
          padding-bottom: 24px;
        }
        .timeline-dot {
          position: absolute;
          left: 0;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--border);
          border: 3px solid var(--white);
          box-shadow: 0 0 0 2px var(--border);
        }
        .timeline-item.done .timeline-dot {
          background: var(--menthe);
          box-shadow: 0 0 0 2px var(--menthe);
        }
        .timeline-item.error .timeline-dot {
          background: var(--error);
          box-shadow: 0 0 0 2px var(--error);
        }
        .timeline-line {
          position: absolute;
          left: 6px;
          top: 20px;
          bottom: 0;
          width: 2px;
          background: var(--border);
        }
        .timeline-item.done .timeline-line {
          background: rgba(0, 214, 163, 0.4);
        }
        .timeline-body strong {
          display: block;
          font-size: 0.95rem;
        }
        .timeline-time {
          font-size: 0.8rem;
          color: var(--muted);
        }
      `}</style>
    </ol>
  );
}
