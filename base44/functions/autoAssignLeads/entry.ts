import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Missing leadId' }, { status: 400 });
    }

    // Fetch the lead
    const leads = await base44.entities.Lead.filter({ id: leadId });
    const lead = leads[0];
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Extract zip code from address (last 5 digits)
    const zipMatch = lead.address.match(/(\d{5})(?:\D|$)/);
    const leadZip = zipMatch ? zipMatch[1] : null;

    if (!leadZip) {
      return Response.json({ 
        success: false, 
        message: 'Could not extract zip code from address',
        leadId 
      });
    }

    // Find roofers with matching service areas
    const roofers = await base44.entities.Roofer.filter({ status: 'approved' });
    const matchingRoofers = roofers.filter((r) => 
      r.service_areas && r.service_areas.includes(leadZip)
    );

    // Assign to first matching roofer (in real app, could use load balancing)
    if (matchingRoofers.length > 0) {
      const roofer = matchingRoofers[0];
      await base44.entities.Lead.update(leadId, {
        roofer_id: roofer.id,
        roofer_name: roofer.contact_name,
        roofer_company: roofer.company_name,
        roofer_phone: roofer.phone,
        roofer_rating: roofer.rating,
        roofer_reviews: roofer.total_reviews,
        assigned_by_service_area: true,
      });

      return Response.json({
        success: true,
        message: `Lead assigned to ${roofer.company_name}`,
        roofer_id: roofer.id,
        assigned_by_service_area: true,
      });
    }

    return Response.json({
      success: false,
      message: 'No roofers available in service area',
      leadId,
      zip: leadZip,
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});