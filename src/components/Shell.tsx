import { Activity, Database, FileSearch, Network, ShieldCheck } from 'lucide-react';

interface ShellProps {
  view: 'dashboard' | 'sources';
  onViewChange: (view: 'dashboard' | 'sources') => void;
  children: React.ReactNode;
}

export function Shell({ view, onViewChange, children }: ShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Network size={24} /></div>
          <div>
            <strong>NexusProfiling</strong>
            <span>Legal OSINT Lab</span>
          </div>
        </div>

        <nav className="nav">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => onViewChange('dashboard')}>
            <Activity size={18} /> Dashboard
          </button>
          <button className={view === 'sources' ? 'active' : ''} onClick={() => onViewChange('sources')}>
            <Database size={18} /> Fontes OSINT
          </button>
        </nav>

        <div className="legal-tile">
          <ShieldCheck size={18} />
          <span>Somente fontes públicas, autorizadas e registradas como evidência.</span>
        </div>

        <div className="sidebar-footer">
          <FileSearch size={16} />
          <span>Local first MVP</span>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
