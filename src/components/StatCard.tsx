interface StatCardProps {
  label: string;
  value: string | number;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

export function StatCard({ label, value, tone = 'blue' }: StatCardProps) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
