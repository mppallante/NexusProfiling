import { useEffect, useState } from 'react';
import { Shell } from './components/Shell';
import { apiClient } from './services/api';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { Dashboard } from './pages/Dashboard';
import { SourcesPage } from './pages/SourcesPage';
import type { CaseDetail, CaseRecord, OsintSourceRecord } from './types/domain';

export function App() {
  const [view, setView] = useState<'dashboard' | 'sources'>('dashboard');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [sources, setSources] = useState<OsintSourceRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>();
  const [detail, setDetail] = useState<CaseDetail>();
  const [error, setError] = useState('');

  async function loadCases() {
    const data = await apiClient.listCases();
    setCases(data);
    if (!selectedCaseId && data[0]) {
      setSelectedCaseId(data[0].id);
    }
  }

  async function loadSources() {
    setSources(await apiClient.listSources());
  }

  async function loadDetail(caseId = selectedCaseId) {
    if (!caseId) return;
    setDetail(await apiClient.getCase(caseId));
    await loadSources();
    await loadCases();
  }

  useEffect(() => {
    loadCases().then(loadSources).catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar.'));
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadDetail(selectedCaseId).catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar caso.'));
    }
  }, [selectedCaseId]);

  async function createCase(title: string, summary: string) {
    const created = await apiClient.createCase(title, summary);
    setSelectedCaseId(created.id);
    setDetail(created);
    await loadCases();
  }

  return (
    <Shell view={view} onViewChange={setView}>
      {error && <div className="notice danger app-error">{error}</div>}
      {view === 'sources' ? (
        <SourcesPage sources={sources} />
      ) : (
        <>
          <Dashboard
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            onCreateCase={createCase}
          />
          {detail && (
            <CaseDetailPage
              detail={detail}
              onReload={() => loadDetail(detail.id)}
              onDetailUpdated={setDetail}
            />
          )}
        </>
      )}
    </Shell>
  );
}
