import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { project_id, milestone_index, amount } = session.metadata || {};

    if (!project_id || milestone_index === undefined) {
      return Response.json({ received: true });
    }

    try {
      const base44 = createClientFromRequest(req);
      const projects = await base44.asServiceRole.entities.Project.filter({ id: project_id });
      if (!projects.length) {
        console.error("Project not found:", project_id);
        return Response.json({ received: true });
      }

      const project = projects[0];
      const milestones = [...(project.milestones || [])];
      const idx = parseInt(milestone_index);
      const paidAmount = parseFloat(amount);

      // Mark milestone payment as paid
      if (milestones[idx]) {
        milestones[idx] = { ...milestones[idx], payment_status: "paid" };
      }

      // Add transaction record
      const txDescription = session.metadata?.description || milestones[idx]?.title || "Project Payment";
      const transactions = [...(project.payment_transactions || []), {
        amount: paidAmount,
        description: txDescription,
        date: new Date().toLocaleDateString(),
        status: "completed",
        method: "Stripe",
        stripe_session_id: session.id,
      }];

      const amount_paid = (project.amount_paid || 0) + paidAmount;

      await base44.asServiceRole.entities.Project.update(project_id, {
        milestones,
        payment_transactions: transactions,
        amount_paid,
      });

      // Send confirmation email to homeowner
      if (project.homeowner_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: project.homeowner_email,
          subject: "Payment Confirmed ✓",
          body: `Hi ${project.homeowner_name || ""},\n\nYour payment of $${paidAmount.toLocaleString()} for "${milestones[idx]?.title}" has been confirmed.\n\nTotal paid: $${amount_paid.toLocaleString()} of $${project.contract_amount?.toLocaleString()}\n\nThank you!\nRoofQuote AI`,
        });
      }

      console.log(`Payment recorded: $${paidAmount} for project ${project_id}, milestone ${idx}`);
    } catch (err) {
      console.error("Error updating project after payment:", err.message);
    }
  }

  return Response.json({ received: true });
});