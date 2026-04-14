import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[STRIPE_WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[STRIPE_WEBHOOK] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;

      if (userId) {
        const { error } = await supabase
          .from('users')
          .update({
            is_pro: true,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId);

        if (error) {
          console.error('[STRIPE_WEBHOOK] Failed to upgrade user:', error);
        } else {
          console.log(`[STRIPE_WEBHOOK] User ${userId} upgraded to Pro`);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID and downgrade
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId);

      if (users && users.length > 0) {
        const { error } = await supabase
          .from('users')
          .update({ is_pro: false })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[STRIPE_WEBHOOK] Failed to downgrade user:', error);
        } else {
          console.log(`[STRIPE_WEBHOOK] Customer ${customerId} downgraded from Pro`);
        }
      }
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
