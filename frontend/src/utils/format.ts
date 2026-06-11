export const fmt = {
  currency: (n: number | null | undefined, compact = false) => {
    if (n == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: compact ? 'compact' : 'standard',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  },

  percent: (n: number | null | undefined) => {
    if (n == null) return '—';
    return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  },

  number: (n: number | null | undefined, decimals = 4) => {
    if (n == null) return '—';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  },

  date: (s: string | null | undefined) => {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  },

  shortDate: (s: string | null | undefined) => {
    if (!s) return '';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
};

export const isPositive = (n: number) => n >= 0;

export const profitClass = (n: number) =>
  n >= 0 ? 'text-emerald-600' : 'text-red-600';

export const profitBgClass = (n: number) =>
  n >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';

export const today = () => new Date().toISOString().split('T')[0];
