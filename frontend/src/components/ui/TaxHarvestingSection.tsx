import { useState, useEffect, useCallback } from 'react';
import {
  Leaf, TrendingDown, ArrowRight, CheckCircle2,
  AlertTriangle, Info, Settings, ChevronDown, ChevronUp,
  ShoppingCart, DollarSign
} from 'lucide-react';
import type { TaxHarvesting, HarvestingOpportunity, TaxSettings } from '../../types';

// ─── Inline format helpers (no external dep needed) ──────────────────────────
const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

// ─── Quality badge ────────────────────────────────────────────────────────────
const QUALITY_STYLES: Record<string, string> = {
  EXCELLENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GOOD:      'bg-blue-50    text-blue-700    border-blue-200',
  FAIR:      'bg-amber-50   text-amber-700   border-amber-200',
};

function QualityBadge({ quality }: { quality: string }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${QUALITY_STYLES[quality] ?? QUALITY_STYLES.FAIR}`}>
      {quality} match
    </span>
  );
}

// ─── Single opportunity card ──────────────────────────────────────────────────
function OpportunityCard({
  opp,
  onSell,
  onBuy,
}: {
  opp: HarvestingOpportunity;
  onSell: (symbol: string) => void;
  onBuy:  (symbol: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lossDropPct = opp.sellAvgBuyPrice > 0
    ? ((opp.sellCurrentPrice - opp.sellAvgBuyPrice) / opp.sellAvgBuyPrice) * 100
    : 0;

  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          {/* Left: sell → buy */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* SELL side */}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-0.5">Sell</p>
              <p className="font-bold text-slate-800 font-mono">{opp.sellSymbol}</p>
              <p className="text-xs text-slate-400 truncate max-w-[130px]">{opp.sellCompanyName}</p>
              <p className="text-xs text-red-600 font-semibold mt-0.5">
                −{inr(opp.unrealizedLoss)} loss
              </p>
            </div>

            <ArrowRight size={16} className="text-slate-300 shrink-0 mt-4" />

            {/* BUY side */}
            {opp.substituteSymbol ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Replace with</p>
                  <QualityBadge quality={opp.substituteQuality} />
                </div>
                <p className="font-bold text-slate-800 font-mono">{opp.substituteSymbol}</p>
                <p className="text-xs text-slate-400 truncate max-w-[150px]">{opp.substituteCompanyName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {opp.substituteSector} · {opp.marketCapDiffPercent.toFixed(0)}% market cap diff
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-xs text-slate-400 italic">No substitute found in catalog</p>
              </div>
            )}
          </div>

          {/* Right: tax saving + actions */}
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Est. Tax Saving</p>
            <p className="text-2xl font-bold text-emerald-600">{inr(opp.estimatedTaxSaving)}</p>
            <p className="text-[11px] text-slate-400">at {opp.taxRateUsed.toFixed(0)}% tax rate</p>

            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => onSell(opp.sellSymbol)}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg
                           bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <TrendingDown size={11} /> Sell {opp.sellSymbol}
              </button>
              {opp.substituteSymbol && (
                <button
                  onClick={() => onBuy(opp.substituteSymbol!)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg
                             bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <ShoppingCart size={11} /> Buy {opp.substituteSymbol}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Less detail' : 'More detail'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-surface-50 border-t border-surface-200 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 mb-1">Avg Buy Price</p>
            <p className="font-semibold text-slate-700">{inr(opp.sellAvgBuyPrice)}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Current Price</p>
            <p className={`font-semibold ${lossDropPct < 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {inr(opp.sellCurrentPrice)} ({pct(lossDropPct)})
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Quantity</p>
            <p className="font-semibold text-slate-700">{opp.sellQuantity.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Gains Offset</p>
            <p className="font-semibold text-slate-700">{inr(opp.gainsOffset)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({
  settings,
  onSave,
  saving,
}: {
  settings: TaxSettings;
  onSave: (s: TaxSettings) => void;
  saving: boolean;
}) {
  const [taxRate, setTaxRate]       = useState(String(settings.taxRate));
  const [fyStart, setFyStart]       = useState(settings.fyStartMonth);

  return (
    <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Tax Settings</p>
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Capital Gains Tax Rate</label>
          <div className="flex rounded-lg border border-surface-200 overflow-hidden text-xs font-semibold">
            {['10', '15', '30'].map(r => (
              <button
                key={r}
                onClick={() => setTaxRate(r)}
                className={`px-3 py-2 transition-colors ${
                  taxRate === r
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-surface-100'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            India: 15% STCG · 10% LTCG · US: 0/15/20%
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Financial Year</label>
          <div className="flex rounded-lg border border-surface-200 overflow-hidden text-xs font-semibold">
            {[['APR', 'India (Apr–Mar)'], ['JAN', 'US (Jan–Dec)']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFyStart(val)}
                className={`px-3 py-2 transition-colors ${
                  fyStart === val
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-surface-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onSave({ taxRate: Number(taxRate), fyStartMonth: fyStart })}
          disabled={saving}
          className="btn-primary text-xs py-2 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save & Recalculate'}
        </button>
      </div>
    </div>
  );
}

// ─── Main exported section ────────────────────────────────────────────────────
interface Props {
  data: TaxHarvesting | null;
  settings: TaxSettings | null;
  loading: boolean;
  onSaveSettings: (s: TaxSettings) => Promise<void>;
  onSell: (symbol: string) => void;
  onBuy:  (symbol: string) => void;
}

export default function TaxHarvestingSection({
  data, settings, loading, onSaveSettings, onSell, onBuy
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const handleSaveSettings = async (s: TaxSettings) => {
    setSettingsSaving(true);
    try { await onSaveSettings(s); }
    finally { setSettingsSaving(false); }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-emerald-600" />
          <p className="section-title mb-0">Tax Loss Harvesting</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── No data ────────────────────────────────────────────────────────────────
  if (!data) return null;

  // ── Empty states ───────────────────────────────────────────────────────────
  const renderEmptyState = () => {
    if (data.noGainsToOffset) {
      return (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">No realized gains this financial year</p>
            <p className="text-xs text-blue-600 mt-1">
              You have no profits from selling stocks in {data.financialYear}. Tax loss harvesting
              only helps when you have realized gains to offset. Keep investing and check back when
              you've sold some profitable positions.
            </p>
          </div>
        </div>
      );
    }
    if (data.noLossesToHarvest) {
      return (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All your holdings are profitable!</p>
            <p className="text-xs text-emerald-600 mt-1">
              You have {inr(data.totalRealizedGains)} in realized gains this year, but no current
              holdings are sitting at a loss. There's nothing to harvest — that's a good problem to have.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const emptyState = renderEmptyState();

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5 space-y-5">

      {/* ── Section header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-emerald-600" />
          <p className="section-title mb-0">Tax Loss Harvesting</p>
          <span className="text-[11px] text-slate-400 font-medium">{data.financialYear}</span>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Settings size={13} />
          Tax Settings
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && settings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          saving={settingsSaving}
        />
      )}

      {/* ── Summary strip ── */}
      {!emptyState && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Realized Gains
            </p>
            <p className="text-lg font-bold text-slate-800">{inr(data.totalRealizedGains)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">This financial year</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Harvestable Losses
            </p>
            <p className="text-lg font-bold text-red-600">−{inr(data.totalHarvestableLoss)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Across {data.opportunities.length} position{data.opportunities.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Gains Offset
            </p>
            <p className="text-lg font-bold text-slate-800">{inr(data.totalGainsOffset)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Taxable amount reduced</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              Tax Saving
            </p>
            <p className="text-lg font-bold text-emerald-700">{inr(data.totalEstimatedTaxSaving)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">At {data.taxRate.toFixed(0)}% tax rate</p>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {emptyState}

      {/* ── Opportunity cards ── */}
      {!emptyState && data.opportunities.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Top Opportunities — Ranked by Tax Saving
          </p>
          {data.opportunities.map((opp, i) => (
            <OpportunityCard
              key={i}
              opp={opp}
              onSell={onSell}
              onBuy={onBuy}
            />
          ))}
        </div>
      )}

      {/* ── How it works callout ── */}
      {!emptyState && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">How it works</p>
            <p>
              Sell the losing stock to book the loss on paper. Immediately buy the
              replacement stock to maintain your sector exposure. The booked loss
              offsets your realized gains, reducing your taxable income.
            </p>
            <p className="font-medium">
              ⚠ Do not buy back the same stock within 30 days — tax authorities may
              disallow the loss. The substitutes shown are different companies in the
              same sector. This is informational only — consult a tax advisor before acting.
            </p>
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-slate-400 border-t border-surface-100 pt-3">
        Calculations use weighted-average cost basis. Tax saving estimates are
        approximate and depend on your actual tax slab, holding period (STCG vs LTCG),
        and applicable surcharge. This is not tax advice.
      </p>
    </div>
  );
}
