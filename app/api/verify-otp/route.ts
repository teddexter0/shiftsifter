import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL!;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ success: false, error: 'Missing fields.' }, { status: 400 });
  }

  if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    return NextResponse.json({ success: false, error: 'Not authorised.' }, { status: 403 });
  }

  const stored = await redis.get<string>(`otp:${email.toLowerCase()}`);

  if (!stored) {
    return NextResponse.json({ success: false, error: 'No code found. Request a new one.' }, { status: 400 });
  }

  if (code.trim() !== stored) {
    return NextResponse.json({ success: false, error: 'Wrong code. Try again.' }, { status: 400 });
  }

  await redis.del(`otp:${email.toLowerCase()}`);
  return NextResponse.json({ success: true });
}
