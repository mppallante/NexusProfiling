import type { CaseDetail, CaseRecord, OsintRunRequest, OsintRunResponse, OsintSourceRecord } from '../types/domain';

export function getApiUrl(path: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://127.0.0.1:3333');
  return `${apiBaseUrl}${path}`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(url), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  listCases: () => api<CaseRecord[]>('/api/cases'),
  getCase: (caseId: string) => api<CaseDetail>(`/api/cases/${caseId}`),
  createCase: (title: string, summary: string) =>
    api<CaseDetail>('/api/cases', { method: 'POST', body: JSON.stringify({ title, summary }) }),
  listSources: () => api<OsintSourceRecord[]>('/api/osint-sources'),
  runOsint: (request: OsintRunRequest) =>
    api<OsintRunResponse>('/api/osint/run', { method: 'POST', body: JSON.stringify(request) }),
  updateProfile: (caseId: string, profile: CaseDetail['profile']) =>
    api<CaseDetail>(`/api/cases/${caseId}/profile`, { method: 'PUT', body: JSON.stringify(profile) }),
  updateChecklist: (caseId: string, checklist: CaseDetail['checklist']) =>
    api<CaseDetail>(`/api/cases/${caseId}/checklist`, { method: 'PUT', body: JSON.stringify(checklist) })
};
