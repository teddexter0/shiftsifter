import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Redis } from '@upstash/redis';

const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL!;
const resend = new Resend(process.env.RESEND_API_KEY!);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    return NextResponse.json({ message: 'If that email is authorised, a code is on its way.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${email.toLowerCase()}`, code, { ex: 600 });

  await resend.emails.send({
    from: 'ShiftSifter <onboarding@resend.dev>',
    to: email,
    subject: `Your ShiftSifter code: ${code}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#080d14;color:#e8eef4;border-radius:12px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
          <span style="font-size:24px;">⚕</span>
          <span style="font-size:18px;font-weight:900;letter-spacing:-0.5px;">ShiftSifter</span>
        </div>
        <p style="color:#90a4ae;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">MTRH Emergency Department</p>
        <h2 style="font-size:22px;margin:0 0 20px;color:#ffffff;">Your sign-in code</h2>
        <div style="background:#0d47a1;border-radius:10px;padding:20px 24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:38px;font-weight:900;letter-spacing:10px;color:#ffffff;">${code}</span>
        </div>
        <p style="color:#546e7a;font-size:13px;">Expires in <strong style="color:#90a4ae;">10 minutes</strong>. One use only.</p>
      </div>
    `,
  });

  return NextResponse.json({ message: 'If that email is authorised, a code is on its way.' });
}
