import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, quantity = 1, email } = body || {};

    // If Stripe key present, create a real Checkout Session
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            { price: priceId || process.env.STRIPE_DEFAULT_PRICE_ID, quantity },
          ],
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/result?checkout=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/result?checkout=cancel`,
          customer_email: email || undefined,
        });

        return NextResponse.json({ url: session.url });
      } catch (err) {
        console.error('stripe checkout error', err);
        return NextResponse.json({ error: 'stripe_error' }, { status: 500 });
      }
    }

    // No Stripe key present — return a simulated checkout URL for demo
    const demoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/result?demo_checkout=1`;
    return NextResponse.json({ url: demoUrl });
  } catch (err) {
    console.error('checkout route error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
