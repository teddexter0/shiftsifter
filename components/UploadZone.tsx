'use client';

import { useCallback, useState, useEffect } from 'react';

interface Props {
  onFile: (file: File) => void;
  error: string | null;
  loading: boolean;
}

type Step = 'email' | 'otp' | 'upload';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

let toastId = 0;

export default function UploadZone({ onFile, error, loading }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      addToast(data.message, 'info');
      setStep('otp');
      setResendCooldown(60);
    } catch {
      addToast('Something went wrong. Try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otp.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('Verified! Upload your rota.', 'success');
        setStep('upload');
      } else {
        addToast(data.error || 'Invalid code.', 'error');
      }
    } catch {
      addToast('Something went wrong. Try again.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d2a4a 0%, #080d14 70%)' }}>

      {/* Toast stack */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div key={t.id} className="rounded-xl px-4 py-3 text-sm font-medium shadow-xl flex items-center gap-3 animate-fade-in"
            style={{
              background: t.type === 'success' ? '#1b5e20' : t.type === 'error' ? '#7f1d1d' : '#0d2a4a',
              border: `1px solid ${t.type === 'success' ? '#2e7d32' : t.type === 'error' ? '#991b1b' : '#1565c0'}`,
              color: '#fff',
            }}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #0d47a1, #1976d2)' }}>⚕</div>
          <span className="text-2xl font-black tracking-tight text-white"
            style={{ fontFamily: "'Georgia', serif" }}>ShiftSifter</span>
        </div>
        <p className="text-xs text-blue-300/50 tracking-widest uppercase">MTRH Emergency Department</p>
      </div>

      {/* Step: Email */}
      {step === 'email' && (
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-blue-900/50 bg-white/[0.03] px-8 py-10 flex flex-col gap-5">
            <div className="text-center">
              <p className="text-white font-semibold text-base mb-1">Sign in to continue</p>
              <p className="text-blue-300/40 text-xs">We'll send a one-time code to your email</p>
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              placeholder="you@mtrh.go.ke"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 text-sm"
            />
            <button onClick={handleSendOtp} disabled={sending || !email.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0d47a1, #1976d2)' }}>
              {sending ? 'Sending...' : 'Send code →'}
            </button>
          </div>
        </div>
      )}

      {/* Step: OTP */}
      {step === 'otp' && (
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-blue-900/50 bg-white/[0.03] px-8 py-10 flex flex-col gap-5">
            <div className="text-center">
              <p className="text-white font-semibold text-base mb-1">Check your email</p>
              <p className="text-blue-300/40 text-xs">
                If <span className="text-blue-300/70">{email}</span> is authorised,<br />a 6-digit code is on its way
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 text-2xl text-center tracking-[0.4em] font-bold"
            />
            <button onClick={handleVerifyOtp} disabled={verifying || otp.length < 6}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0d47a1, #1976d2)' }}>
              {verifying ? 'Verifying...' : 'Verify →'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button onClick={() => { setStep('email'); setOtp(''); }}
                className="text-blue-300/30 hover:text-blue-300/60 transition-colors">
                ← Change email
              </button>
              <button onClick={handleSendOtp} disabled={resendCooldown > 0}
                className="text-blue-300/30 hover:text-blue-300/60 transition-colors disabled:opacity-30">
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="relative w-full max-w-lg">
          <label className={`
            flex flex-col items-center justify-center gap-5 cursor-pointer
            rounded-2xl border-2 border-dashed px-10 py-16 transition-all duration-200
            ${dragging
              ? 'border-blue-400 bg-blue-950/40 scale-[1.02]'
              : 'border-blue-900/60 bg-white/[0.03] hover:border-blue-700/70 hover:bg-white/[0.05]'}
          `}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}>
            <input type="file" accept=".xlsx,.xlsm,.xls" className="hidden" onChange={handleChange} />
            {loading ? (
              <>
                <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
                <p className="text-blue-300/70 text-sm">Reading rota...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, #0d2a4a, #0d47a1)' }}>📋</div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg mb-1">Drop the monthly rota here</p>
                  <p className="text-blue-300/50 text-sm">or click to browse · .xlsx / .xlsm</p>
                </div>
              </>
            )}
          </label>
          <div className="absolute inset-0 -z-10 rounded-2xl blur-2xl opacity-20"
            style={{ background: 'radial-gradient(circle, #1565c0, transparent 70%)' }} />
        </div>
      )}

      {error && (
        <div className="mt-6 max-w-lg w-full rounded-xl border border-red-900/50 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      <p className="mt-8 text-blue-300/20 text-xs text-center">
        Files never leave your device · Runs entirely in your browser
      </p>
    </div>
  );
}
