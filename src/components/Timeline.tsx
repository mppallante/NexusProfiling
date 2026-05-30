import type { TimelineEventRecord } from '../types/domain';

export function Timeline({ events }: { events: TimelineEventRecord[] }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Timeline</span>
          <h2>Cronologia</h2>
        </div>
      </div>
      <div className="timeline">
        {events.map((event) => (
          <article key={event.id}>
            <time>{new Date(event.occurredAt).toLocaleString('pt-BR')}</time>
            <strong>{event.title}</strong>
            <p>{event.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
