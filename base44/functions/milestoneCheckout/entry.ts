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

    const { projectId, milestoneTitle, milestoneAmount } = await req.json();

    if (!projectId || !milestoneAmount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch project
    const projects = await base44.entities.Project.filter({ id: projectId });
    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${milestoneTitle || 'Project Payment'} - ${project.address}`,
              description: `Project milestone payment`,
            },
            unit_amount: Math.round(milestoneAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('BASE44_APP_URL')}/project?id=${projectId}&payment_success=true`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/project?id=${projectId}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        project_id: projectId,
        homeowner_email: user.email,
        action: 'milestone_payment',
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Milestone checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});