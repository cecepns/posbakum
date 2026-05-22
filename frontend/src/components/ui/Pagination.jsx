import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 pt-4">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="rounded-lg border p-2 disabled:opacity-40 hover:bg-slate-50">
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium ${p === page ? 'bg-primary-700 text-white' : 'border hover:bg-slate-50'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="rounded-lg border p-2 disabled:opacity-40 hover:bg-slate-50">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
