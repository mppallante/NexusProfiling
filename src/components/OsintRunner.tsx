import { Play, Search } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '../services/api';
import type { OsintInputType, OsintRunResponse } from '../types/domain';

interface OsintRunnerProps {
  caseId: string;
  onComplete: () => void;
}

const labels: Record<OsintInputType, string> = {
  cnpj: 'CNPJ',
  cep: 'CEP',
  domain: 'Domínio',
  email: 'E-mail',
  username: 'Username'
};

export function OsintRunner({ caseId, onComplete }: OsintRunnerProps) {
  const [type, setType] = useState<OsintInputType>('domain');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OsintRunResponse | null>(null);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiClient.runOsint({ caseId, type, input });
      setResult(response);
      setInput('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar OSINT.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel osint-runner">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Executar OSINT</span>
          <h2>Coleta autorizada</h2>
        </div>
        <Search size={20} />
      </div>
      <div className="runner-grid">
        <div className="segmented">
          {(Object.keys(labels) as OsintInputType[]).map((option) => (
            <button key={option} className={type === option ? 'selected' : ''} onClick={() => setType(option)}>
              {labels[option]}
            </button>
          ))}
        </div>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Informe ${labels[type]}`}
        />
        <button className="primary" onClick={run} disabled={loading || input.trim().length < 2}>
          <Play size={18} /> {loading ? 'Executando' : 'Executar'}
        </button>
      </div>
      {result && (
        <div className="notice success">
          <strong>{result.connector}</strong>
          <span>{result.message}</span>
        </div>
      )}
      {error && <div className="notice danger">{error}</div>}
    </section>
  );
}
