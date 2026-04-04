'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import ShiftSifter from '@/components/ShiftSifter';
import UploadZone from '@/components/UploadZone';
import { parseRota, RotaData } from '@/lib/parseRota';

export default function Home() {
  const [rota, setRota] = useState<RotaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((file: File) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const parsed = parseRota(wb);
        setRota(parsed);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not read file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const reset = () => { setRota(null); setError(null); };

  return (
    <main className="min-h-screen bg-[#080d14] text-white">
      {!rota ? (
        <UploadZone onFile={handleFile} error={error} loading={loading} />
      ) : (
        <ShiftSifter rota={rota} onReset={reset} />
      )}
    </main>
  );
}
