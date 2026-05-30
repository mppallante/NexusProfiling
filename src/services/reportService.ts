import type { CaseDetail } from '../types/domain';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rows(items: string[][]): string {
  return items
    .map((item) => `<tr>${item.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
}

export function buildCaseReportHtml(caseDetail: CaseDetail): string {
  const entityById = new Map(caseDetail.entities.map((entity) => [entity.id, entity]));
  const entityRows = rows(caseDetail.entities.map((entity) => [entity.type, entity.label, entity.value, entity.confidence]));
  const evidenceRows = rows(caseDetail.evidences.map((evidence) => [
    evidence.title,
    evidence.source,
    evidence.sourceUrl,
    evidence.collectedAt,
    evidence.confidence
  ]));
  const timelineRows = rows(caseDetail.timeline.map((event) => [event.occurredAt, event.title, event.description]));
  const relationshipRows = rows(caseDetail.relationships.map((relationship) => [
    entityById.get(relationship.sourceEntityId)?.label ?? relationship.sourceEntityId,
    relationship.label,
    entityById.get(relationship.targetEntityId)?.label ?? relationship.targetEntityId,
    relationship.confidence
  ]));

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório NexusProfiling - ${escapeHtml(caseDetail.title)}</title>
  <style>
    body { background: #0f141d; color: #e7edf7; font-family: Inter, Arial, sans-serif; margin: 32px; }
    h1, h2 { color: #ffffff; }
    section { border-top: 1px solid #2b3445; padding: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #2b3445; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #182131; }
    .notice { background: #211b10; border: 1px solid #7c5c1c; padding: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(caseDetail.title)}</h1>
  <p>${escapeHtml(caseDetail.summary)}</p>
  <p>Gerado em ${new Date().toISOString()}</p>
  <div class="notice">${escapeHtml(caseDetail.profile.nonAccusatoryAlert)}</div>

  <section><h2>Entidades</h2><table><thead><tr><th>Tipo</th><th>Rótulo</th><th>Valor</th><th>Confiança</th></tr></thead><tbody>${entityRows}</tbody></table></section>
  <section><h2>Evidências</h2><table><thead><tr><th>Título</th><th>Fonte</th><th>URL</th><th>Coleta</th><th>Confiança</th></tr></thead><tbody>${evidenceRows}</tbody></table></section>
  <section><h2>Vínculos</h2><table><thead><tr><th>Origem</th><th>Relação</th><th>Destino</th><th>Confiança</th></tr></thead><tbody>${relationshipRows}</tbody></table></section>
  <section><h2>Timeline</h2><table><thead><tr><th>Data/hora</th><th>Evento</th><th>Descrição</th></tr></thead><tbody>${timelineRows}</tbody></table></section>

  <section>
    <h2>Perfilamento Comportamental Investigativo</h2>
    <p><strong>Modus operandi observado:</strong> ${escapeHtml(caseDetail.profile.modusOperandi)}</p>
    <p><strong>Padrões recorrentes:</strong> ${escapeHtml(caseDetail.profile.recurringPatterns)}</p>
    <p><strong>Comportamento digital:</strong> ${escapeHtml(caseDetail.profile.digitalBehavior)}</p>
    <p><strong>Recorrência temporal:</strong> ${escapeHtml(caseDetail.profile.temporalRecurrence)}</p>
    <p><strong>Concentração geográfica:</strong> ${escapeHtml(caseDetail.profile.geographicConcentration)}</p>
    <p><strong>Hipóteses investigativas:</strong> ${escapeHtml(caseDetail.profile.hypotheses)}</p>
    <p><strong>Limitações:</strong> ${escapeHtml(caseDetail.profile.limitations)}</p>
  </section>

  <section>
    <h2>Checklist Legal</h2>
    <p><strong>Fonte pública:</strong> ${caseDetail.checklist.publicSource ? 'Sim' : 'Não'}</p>
    <p><strong>Finalidade:</strong> ${escapeHtml(caseDetail.checklist.purpose)}</p>
    <p><strong>Justificativa:</strong> ${escapeHtml(caseDetail.checklist.justification)}</p>
    <p><strong>Autorização:</strong> ${escapeHtml(caseDetail.checklist.authorization)}</p>
    <p><strong>LGPD/privacidade:</strong> ${escapeHtml(caseDetail.checklist.privacyNotes)}</p>
  </section>
</body>
</html>`;
}
