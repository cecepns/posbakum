import { formatStatus } from '@/utils/format';

export default function StatusBadge({ status }) {
  const { label, color } = formatStatus(status);
  return <span className={`badge ${color}`}>{label}</span>;
}
