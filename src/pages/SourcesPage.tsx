import type { OsintSourceRecord } from '../types/domain';

export function SourcesPage({ sources }: { sources: OsintSourceRecord[] }) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fontes OSINT</span>
          <h1>Catálogo e governança</h1>
        </div>
      </header>
      <section className="panel table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Chave</th>
              <th>Documentação</th>
              <th>Limite conhecido</th>
              <th>Observação legal</th>
              <th>Última consulta</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.name}>
                <td>{source.name}</td>
                <td>{source.type}</td>
                <td><span className={`badge ${source.status}`}>{source.status}</span></td>
                <td>{source.requiresApiKey ? 'Sim' : 'Não'}</td>
                <td><a href={source.documentationUrl} target="_blank" rel="noreferrer">Abrir</a></td>
                <td>{source.knownLimit}</td>
                <td>{source.legalNote}</td>
                <td>{source.lastQueriedAt ? new Date(source.lastQueriedAt).toLocaleString('pt-BR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
