import CytoscapeComponent from 'react-cytoscapejs';
import type { CaseDetail, EntityType } from '../types/domain';

interface InvestigationGraphProps {
  detail: CaseDetail;
  filter: EntityType | 'all';
  onFilterChange: (filter: EntityType | 'all') => void;
}

const colors: Record<string, string> = {
  person: '#f6c453',
  email: '#64d2ff',
  domain: '#74d99f',
  cnpj: '#ff8f70',
  cep: '#a78bfa',
  username: '#f472b6',
  public_profile: '#fb7185',
  company: '#45e0c5',
  location: '#93c5fd',
  infrastructure: '#c4b5fd',
  cnae: '#fbbf24'
};

export function InvestigationGraph({ detail, filter, onFilterChange }: InvestigationGraphProps) {
  const visibleEntities = filter === 'all' ? detail.entities : detail.entities.filter((entity) => entity.type === filter);
  const visibleIds = new Set(visibleEntities.map((entity) => entity.id));
  const elements = [
    ...visibleEntities.map((entity) => ({
      data: { id: entity.id, label: entity.label, type: entity.type }
    })),
    ...detail.relationships
      .filter((relationship) => visibleIds.has(relationship.sourceEntityId) && visibleIds.has(relationship.targetEntityId))
      .map((relationship) => ({
        data: {
          id: relationship.id,
          source: relationship.sourceEntityId,
          target: relationship.targetEntityId,
          label: relationship.label
        }
      }))
  ];
  const entityTypes = ['all', ...new Set(detail.entities.map((entity) => entity.type))] as Array<EntityType | 'all'>;

  return (
    <section className="panel graph-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Grafo investigativo</span>
          <h2>Entidades e vínculos</h2>
        </div>
        <select value={filter} onChange={(event) => onFilterChange(event.target.value as EntityType | 'all')}>
          {entityTypes.map((type) => <option key={type} value={type}>{type === 'all' ? 'Todos' : type}</option>)}
        </select>
      </div>
      <CytoscapeComponent
        elements={elements}
        className="cytoscape"
        layout={{ name: 'cose', animate: false, fit: true, padding: 32 }}
        stylesheet={[
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#eef4ff',
              'font-size': 10,
              'text-wrap': 'wrap',
              'text-max-width': '90px',
              'background-color': (element) => colors[element.data('type')] ?? '#8ea4c8',
              width: '34px',
              height: '34px'
            }
          },
          {
            selector: 'edge',
            style: {
              label: 'data(label)',
              color: '#aab6ca',
              'font-size': 8,
              'line-color': '#526072',
              'target-arrow-color': '#526072',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier'
            }
          }
        ]}
      />
    </section>
  );
}
