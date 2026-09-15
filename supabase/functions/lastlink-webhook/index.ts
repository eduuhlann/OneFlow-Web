import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WEBHOOK_SECRET = Deno.env.get('LASTLINK_WEBHOOK_SECRET') || '';

const PLAN = 'oneflow_pro';

interface AdminUser {
  id: string;
  email?: string;
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Validação opcional do token do webhook (configurado na Lastlink)
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get('authorization') || '';
      const tokenHeader = req.headers.get('x-lastlink-token') || '';
      const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const provided = tokenHeader || bearer;
      if (!provided || provided !== WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const payload = await req.json();
    const event: string = payload?.Event || '';
    const data = payload?.Data || {};
    const buyerEmail = data?.Buyer?.Email;
    const subscription = data?.Subscriptions?.[0] || data?.Subscription || {};
    const subscriptionId =
      subscription?.Id || data?.SubscriptionId || null;
    const productId =
      subscription?.ProductId || data?.Product?.Id || data?.Products?.[0]?.Id || null;

    if (!buyerEmail) {
      return new Response(JSON.stringify({ ok: false, reason: 'buyer email missing' }), { status: 200 });
    }

    let status: string | null = null;

    switch (event) {
      case 'Subscription_Product_Access':
        status = data?.Action === 'Add' ? 'active' : 'inactive';
        break;
      case 'Product_Access_Started':
        status = 'active';
        break;
      case 'Product_Access_Ended':
        status = 'inactive';
        break;
      case 'Recurrent_Payment':
      case 'Purchase_Order_Confirmed':
      case 'Purchase_Request_Confirmed':
        status = 'active';
        break;
      case 'Subscription_Canceled':
        status = 'canceled';
        break;
      case 'Subscription_Expired':
        status = 'expired';
        break;
      case 'Payment_Refund':
      case 'Payment_Chargeback':
        status = 'refunded';
        break;
      default:
        // Eventos sem relação direta com o status da assinatura
        return new Response(JSON.stringify({ ok: true, ignored: event }), { status: 200 });
    }

    // Busca o usuário no OneFlow pelo e-mail do comprador
    const user = await findUserByEmail(buyerEmail);
    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'no matching OneFlow user for buyer email' }),
        { status: 200 }
      );
    }

    const upserted = await upsertSubscription(user.id, status, subscriptionId, productId);

    if (!upserted.ok) {
      return new Response(JSON.stringify({ ok: false, reason: 'upsert failed' }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ ok: true, event, user_id: user.id, status }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('lastlink webhook error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});

async function findUserByEmail(email: string): Promise<AdminUser | null> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    console.error('admin users error', res.status, await res.text());
    return null;
  }
  const body = await res.json();
  const user = body?.users?.[0];
  return user ? { id: user.id, email: user.email } : null;
}

async function upsertSubscription(
  userId: string,
  status: string,
  subscriptionId: string | null,
  productId: string | null
): Promise<{ ok: boolean }> {
  const now = new Date().toISOString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      plan: PLAN,
      status,
      lastlink_subscription_id: subscriptionId,
      lastlink_product_id: productId,
      started_at: status === 'active' ? now : undefined,
      updated_at: now,
    }),
  });
  return { ok: res.ok };
}