import { Plus } from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '../components/StatCard';
import type { CaseRecord } from '../types/domain';

interface DashboardProps {
  cases: CaseRecord[];
  selectedCaseId?: string;
  onSelectCase: (caseId: string) => void;
  onCreateCase: (title: string, summary: string) => Promise<void>;
}

export function Dashboard({ cases, selectedCaseId, onSelectCase, onCreateCase }: DashboardProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [creating, setCreating] = useState(false);

  async function submit() {
    setCreating(true);
    try {
      await onCreateCase(title, summary);
      setTitle('');
      setSummary('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Central de casos</h1>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label="Casos" value={cases.length} tone="green" />
        <StatCard label="Ativos" value={cases.filter((item) => item.status === 'active').length} tone="blue" />
        <StatCard label="Ambiente" value="Local" tone="amber" />
      </div>

      <section className="panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Novo caso</span>
            <h2>Registro investigativo</h2>
          </div>
        </div>
        <div className="form-row">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título do caso" />
          <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Resumo" />
          <button className="primary" onClick={submit} disabled={creating || title.trim().length < 3}>
            <Plus size={18} /> Criar
          </button>
        </div>
      </section>

      <section className="case-list">
        {cases.map((item) => (
          <button
            key={item.id}
            className={`case-row ${selectedCaseId === item.id ? 'active' : ''}`}
            onClick={() => onSelectCase(item.id)}
          >
            <span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
            </span>
            <time>{new Date(item.updatedAt).toLocaleString('pt-BR')}</time>
          </button>
        ))}
      </section>
    </div>
  );
}
