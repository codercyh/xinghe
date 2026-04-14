import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.SUBSCRIBE_DATA_DIR || path.join(process.cwd(), '.data');
const SUBSCRIBE_FILE = path.join(DATA_DIR, 'subscribers.json');

function ensureDataDir(){
  try{ fs.mkdirSync(DATA_DIR, { recursive: true }); }catch(e){}
}

function saveSubscriber(obj: any){
  ensureDataDir();
  let arr: any[] = [];
  try{ arr = JSON.parse(fs.readFileSync(SUBSCRIBE_FILE, 'utf-8') || '[]'); }catch(e){}
  arr.push({ ...obj, createdAt: Date.now() });
  fs.writeFileSync(SUBSCRIBE_FILE, JSON.stringify(arr, null, 2));
}

export async function POST(req: Request){
  try{
    const body = await req.json();
    const email = (body.email || '').trim();
    const name = (body.name || '').trim();
    if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }

    // Save locally (placeholder). In production, replace with DB (Supabase/Postgres).
    saveSubscriber({ email, name });

    // If email provider key present, you can add sending logic here.
    // e.g. if (process.env.SENDGRID_API_KEY) { await sendWelcomeEmail(email); }

    return NextResponse.json({ ok: true });
  }catch(err){
    console.error('subscribe error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
