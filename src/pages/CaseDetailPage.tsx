import { Download, Save } from 'lucide-react';
import { useState } from 'react';
import { CaseMap } from '../components/CaseMap';
import { InvestigationGraph } from '../components/InvestigationGraph';
import { OsintRunner } from '../components/OsintRunner';
import { StatCard } from '../components/StatCard';
import { Timeline } from '../components/Timeline';
import { apiClient } from '../services/api';
import type { CaseDetail, EntityType } from '../types/domain';

interface CaseDetailPageProps {
  detail: CaseDetail;
  onReload: () => Promise<void>;
  onDetailUpdated: (detail: CaseDetail) => void;
}

export function CaseDetailPage({ detail, onReload, onDetailUpdated }: CaseDetailPageProps) {
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  const [profile, setProfile] = useState(detail.profile);
  const [checklist, setChecklist] = useState(detail.checklist);

  async function saveProfile() {
    onDetailUpdated(await apiClient.updateProfile(detail.id, profile));
  }

  async function saveChecklist() {
    onDetailUpdated(await apiClient.updateChecklist(detail.id, checklist));
  }

  return (
    <div className="page detail-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Caso</span>
          <h1>{detail.title}</h1>
          <p>{detail.summary}</p>
        </div>
        <a className="button ghost" href={`/api/cases/${detail.id}/report.html`} target="_blank" rel="noreferrer">
          <Download size={18} /> Relatório HTML
        </a>
      </header>

      <div className="stats-grid">
        <StatCard label="Entidades" value={detail.entities.length} tone="green" />
        <StatCard label="Evidências" value={detail.evidences.length} tone="blue" />
        <StatCard label="Vínculos" value={detail.relationships.length} tone="amber" />
        <StatCard label="Eventos" value={detail.timeline.length} tone="red" />
      </div>

      <OsintRunner caseId={detail.id} onComplete={onReload} />

      <div className="workspace-grid">
        <InvestigationGraph detail={detail} filter={filter} onFilterChange={setFilter} />
        <CaseMap detail={detail} />
      </div>

      <div className="workspace-grid two">
        <Timeline events={detail.timeline} />
        <section className="panel">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Evidências</span>
              <h2>Registro de coleta</h2>
            </div>
          </div>
          <div className="evidence-list">
            {detail.evidences.map((evidence) => (
              <article key={evidence.id}>
                <strong>{evidence.title}</strong>
                <span>{evidence.source} · {new Date(evidence.collectedAt).toLocaleString('pt-BR')}</span>
                <p>{evidence.description}</p>
                <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceUrl}</a>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Perfilamento comportamental</span>
            <h2>Análise investigativa não acusatória</h2>
          </div>
          <button className="icon-button" title="Salvar perfilamento" onClick={saveProfile}><Save size={18} /></button>
        </div>
        <div className="profile-grid">
          {([
            ['modusOperandi', 'Modus operandi observado'],
            ['recurringPatterns', 'Padrões recorrentes'],
            ['digitalBehavior', 'Comportamento digital'],
            ['temporalRecurrence', 'Recorrência temporal'],
            ['geographicConcentration', 'Concentração geográfica'],
            ['hypotheses', 'Hipóteses investigativas'],
            ['limitations', 'Limitações da análise'],
            ['nonAccusatoryAlert', 'Alerta contra conclusão acusatória']
          ] as const).map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <textarea value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Checklist legal</span>
            <h2>Finalidade e autorização</h2>
          </div>
          <button className="icon-button" title="Salvar checklist" onClick={saveChecklist}><Save size={18} /></button>
        </div>
        <div className="checklist-grid">
          <label className="toggle">
            <input
              type="checkbox"
              checked={checklist.publicSource}
              onChange={(event) => setChecklist({ ...checklist, publicSource: event.target.checked })}
            />
            <span>Fonte pública</span>
          </label>
          {([
            ['purpose', 'Finalidade'],
            ['justification', 'Justificativa'],
            ['authorization', 'Autorização'],
            ['privacyNotes', 'Observações LGPD/privacidade']
          ] as const).map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input value={checklist[key]} onChange={(event) => setChecklist({ ...checklist, [key]: event.target.value })} />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
