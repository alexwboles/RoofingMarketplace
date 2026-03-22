import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, leadPrice = 5000 } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Missing leadId' }, { status: 400 });
    }

    // Fetch lead to verify
    const leads = await base44.entities.Lead.filter({ id: leadId });
    const lead = leads[0];
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Claim Lead - ${lead.address}`,
              description: `Roof area: ${lead.roof_area_sqft} sq ft`,
            },
            unit_amount: leadPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/success?lead_id=${leadId}`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        lead_id: leadId,
        user_email: user.email,
        action: 'claim_lead',
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});