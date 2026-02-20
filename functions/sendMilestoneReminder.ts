import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active projects
    const projects = await base44.asServiceRole.entities.Project.list();

    let remindersSent = 0;

    for (const project of projects) {
      if (!project.homeowner_email) continue;
      if (["completed", "warranty"].includes(project.status)) continue;

      const milestones = project.milestones || [];

      // Find complete milestones with unpaid amounts
      const unpaidMilestones = milestones.filter(
        (m) => m.status === "complete" && m.payment_status === "unpaid" && m.payment_amount > 0
      );

      if (!unpaidMilestones.length) continue;

      const totalOwed = unpaidMilestones.reduce((s, m) => s + (m.payment_amount || 0), 0);
      const milestoneList = unpaidMilestones.map((m) => `  • ${m.title}: $${m.payment_amount?.toLocaleString()}`).join("\n");

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: project.homeowner_email,
        subject: `Payment Due: $${totalOwed.toLocaleString()} for your roofing project`,
        body: `Hi ${project.homeowner_name || ""},\n\nThis is a reminder that the following completed milestones on your roofing project at ${project.address} have outstanding payments:\n\n${milestoneList}\n\nTotal due: $${totalOwed.toLocaleString()}\n\nPlease log in to your project dashboard to make your payment.\n\nThank you,\nRoofQuote AI Team`,
      });

      remindersSent++;
      console.log(`Reminder sent to ${project.homeowner_email} for project ${project.id}`);
    }

    return Response.json({ success: true, remindersSent });
  } catch (error) {
    console.error("Reminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});