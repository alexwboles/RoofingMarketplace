import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ConversionRateChart({ leads, projects }) {
  // Calculate conversion by lead source/status
  const statusData = [
    { stage: 'Received', count: leads.length },
    { stage: 'Contacted', count: leads.filter(l => ['contacted', 'scheduled', 'proposal_sent'].includes(l.status)).length },
    { stage: 'Proposal Sent', count: leads.filter(l => l.status === 'proposal_sent').length },
    { stage: 'Won', count: leads.filter(l => ['won', 'accepted'].includes(l.status)).length },
  ];

  // Calculate conversion rate at each stage
  const conversionData = statusData.map((item, idx) => {
    const prevCount = idx === 0 ? statusData[0].count : statusData[idx - 1].count;
    const rate = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;
    return { ...item, conversionRate: rate };
  });

  // Calculate monthly conversion trend
  const today = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthLeads = leads.filter(l => {
      const lDate = new Date(l.created_date);
      return lDate.getMonth() === date.getMonth() && lDate.getFullYear() === date.getFullYear();
    });
    const wonInMonth = monthLeads.filter(l => ['won', 'accepted'].includes(l.status)).length;
    monthlyData.push({
      month: date.toLocaleString('default', { month: 'short' }),
      leads: monthLeads.length,
      won: wonInMonth,
      rate: monthLeads.length > 0 ? Math.round((wonInMonth / monthLeads.length) * 100) : 0
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Leads" />
              <Bar dataKey="conversionRate" fill="#10b981" name="Conv. Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Conversion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#10b981" name="Conversion Rate %" strokeWidth={2} />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Total Leads" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}