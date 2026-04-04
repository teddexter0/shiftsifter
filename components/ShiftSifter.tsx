'use client';

import { useState, useMemo } from 'react';
import { RotaData } from '@/lib/parseRota';

interface Props {
  rota: RotaData;
  onReset: () => void;
}

const SHIFT_CONFIG: Record<string, { label: string; time: string; color: string; bg: string; dot: string }> = {
  N:   { label: 'Night',    time: '6:30 PM–7:30 AM', color: '#7986cb', bg: '#1a237e22', dot: '#3949ab' },
  S:   { label: 'Day',      time: '7:30 AM–6:30 PM', color: '#29b6f6', bg: '#01579b22', dot: '#0288d1' },
  E:   { label: 'Early',    time: '7:30 AM–4:30 PM', color: '#26a69a', bg: '#00433022', dot: '#00897b' },
  DO:  { label: 'Day Off',  time: 'Off',              color: '#8d6e63', bg: '#3e272322', dot: '#6d4c41' },
  DOO: { label: 'Day Off',  time: 'Off (Owing)',      color: '#8d6e63', bg: '#3e272322', dot: '#6d4c41' },
  PH:  { label: 'PH',      time: 'Public Holiday',   color: '#ab47bc', bg: '#4a148c22', dot: '#8e24aa' },
  NO:  { label: 'Night Off',time: 'Night Off',        color: '#546e7a', bg: '#1c313a22', dot: '#455a64' },
};

const SHIFT_FILTER_KEYS = ['N','S','E','DO','PH'];
const WEEKEND_DAYS = new Set(['Sat','Sun']);

function getWeekRanges(daysInMonth: number) {
  const weeks = [];
  for (let start = 0; start < daysInMonth; start += 7) {
    weeks.push([start, Math.min(start + 6, daysInMonth - 1)]);
  }
  return weeks;
}

function normaliseForFilter(code: string): string {
  if (!code) return '';
  const c = code.toUpperCase();
  if (c === 'DOO' || c === 'D0') return 'DO';
  return c;
}

export default function ShiftSifter({ rota, onReset }: Props) {
  const [activeShift, setActiveShift] = useState<string>('ALL');
  const [activeWeek, setActiveWeek] = useState<number>(-1); // -1 = all
  const [search, setSearch] = useState('');

  const weekRanges = useMemo(() => getWeekRanges(rota.daysInMonth), [rota.daysInMonth]);

  const dayRange = activeWeek === -1
    ? [0, rota.daysInMonth - 1]
    : weekRanges[activeWeek];

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return rota.staff;
    return rota.staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, rota.staff]);

  const days = useMemo(() => {
    const result = [];
    for (let d = dayRange[0]; d <= dayRange[1]; d++) {
      const shiftsToDraw = activeShift === 'ALL' ? SHIFT_FILTER_KEYS : [activeShift];
      const sections = shiftsToDraw.map(s => {
        const nurses = filteredStaff.filter(st => normaliseForFilter(st.shifts[d]) === s);
        return { key: s, nurses };
      }).filter(sec => activeShift !== 'ALL' || sec.nurses.length > 0);

      const totalOnShift = filteredStaff.filter(st => {
        const c = normaliseForFilter(st.shifts[d]);
        return c === 'N' || c === 'S' || c === 'E';
      }).length;

      result.push({ dayIndex: d, dayNum: d + 1, dayName: rota.dayNames[d], sections, totalOnShift });
    }
    return result;
  }, [dayRange, activeShift, filteredStaff, rota.dayNames]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080d14' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' }}>
        <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-lg">⚕</span>
            <span className="font-black text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>ShiftSifter</span>
            <span className="text-blue-400/50 text-sm ml-1">·</span>
            <span className="text-blue-300/70 text-sm font-medium">{rota.month} {rota.year}</span>
            <span className="text-blue-400/30 text-xs ml-1">· {rota.staff.length} staff</span>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="px-3 py-1.5 rounded-lg text-sm border border-white/10 bg-white/5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 w-44"
          />

          {/* Shift filter */}
          <div className="flex gap-1 flex-wrap">
            {['ALL', ...SHIFT_FILTER_KEYS].map(s => {
              const cfg = SHIFT_CONFIG[s];
              const isActive = activeShift === s;
              return (
                <button key={s}
                  onClick={() => setActiveShift(s)}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150"
                  style={{
                    background: isActive ? (cfg?.dot ?? '#1565c0') : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#fff' : (cfg?.color ?? '#90a4ae'),
                    border: `1px solid ${isActive ? (cfg?.dot ?? '#1565c0') : 'transparent'}`,
                  }}>
                  {s === 'ALL' ? 'All Shifts' : cfg?.label ?? s}
                </button>
              );
            })}
          </div>

          {/* Week filter */}
          <div className="flex gap-1 ml-auto flex-wrap">
            <button onClick={() => setActiveWeek(-1)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${activeWeek === -1 ? 'bg-blue-700 border-blue-500 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
              All
            </button>
            {weekRanges.map((_, i) => (
              <button key={i} onClick={() => setActiveWeek(i)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${activeWeek === i ? 'bg-blue-700 border-blue-500 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                W{i + 1}
              </button>
            ))}
          </div>

          <button onClick={onReset} className="text-xs text-white/20 hover:text-white/50 transition-colors ml-2">
            ↑ New file
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 p-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {days.map(({ dayIndex, dayNum, dayName, sections, totalOnShift }) => {
          const isWeekend = WEEKEND_DAYS.has(dayName);
          return (
            <div key={dayIndex} className="rounded-xl overflow-hidden border border-white/5 flex flex-col"
              style={{ background: '#0e1822' }}>

              {/* Day header */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: isWeekend ? 'linear-gradient(135deg, #7b1f00, #bf360c)' : 'linear-gradient(135deg, #0d47a1, #1565c0)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base">{dayNum}</span>
                  <span className="text-white/60 text-xs font-medium bg-black/20 px-2 py-0.5 rounded-full">{dayName}</span>
                </div>
                <span className="text-white/70 text-xs font-semibold">{totalOnShift} on shift</span>
              </div>

              {/* Shift sections */}
              <div className="flex-1 divide-y divide-white/5">
                {sections.length === 0 ? (
                  <div className="px-4 py-6 text-center text-white/20 text-sm italic">No staff for selected filter</div>
                ) : sections.map(({ key, nurses }) => {
                  const cfg = SHIFT_CONFIG[key] ?? SHIFT_CONFIG['N'];
                  return (
                    <div key={key} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-white/20 text-xs ml-auto">{cfg.time}</span>
                        <span className="text-white/30 text-xs ml-2">{nurses.length}</span>
                      </div>
                      {nurses.length === 0 ? (
                        <p className="text-white/20 text-xs italic">none</p>
                      ) : (
                        <ul className="space-y-1">
                          {nurses.map((n, i) => (
                            <li key={n.name} className="flex items-center gap-2 text-sm">
                              <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: cfg.color, opacity: 0.5 }}>{i + 1}</span>
                              <span className="text-white/85 flex-1 truncate">{n.name}</span>
                              <span className="text-white/25 text-xs flex-shrink-0">{n.cadre}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="px-6 py-3 border-t border-white/5 text-xs text-white/15 flex justify-between">
        <span>MTRH Emergency Department · ShiftSifter</span>
        <span>Built by Ted · dex-dev.org</span>
      </footer>
    </div>
  );
}
