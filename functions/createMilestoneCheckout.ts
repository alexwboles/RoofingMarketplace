import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const { projectId, milestoneIndex, amount, description, successUrl, cancelUrl } = await req.json();

    if (!projectId || milestoneIndex === undefined || !amount) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100), // cents
          product_data: {
            name: description || "Milestone Payment",
            description: `Project milestone payment`,
          },
        },
        quantity: 1,
      }],
      success_url: successUrl + `&session_id={CHECKOUT_SESSION_ID}&milestone=${milestoneIndex}`,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        project_id: projectId,
        milestone_index: String(milestoneIndex),
        amount: String(amount),
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});