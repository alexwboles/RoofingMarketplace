import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ProfitabilityChart({ projects, leads, bids }) {
  const completedProjects = projects.filter(p => ['completed', 'warranty'].includes(p.status));
  
  // Profitability by project
  const projectProfitability = completedProjects.map(p => {
    const bid = bids.find(b => b.lead_id === p.lead_id);
    const estimatedCost = bid?.estimated_total || 0;
    const bidAmount = bid?.bid_amount || estimatedCost;
    const actualCost = (bid?.materials_cost || 0) + (bid?.labor_cost || 0);
    const margin = bidAmount - actualCost;
    const marginPercent = bidAmount > 0 ? Math.round((margin / bidAmount) * 100) : 0;
    return {
      name: p.address?.split(',')[0] || 'Project',
      revenue: p.contract_amount || bidAmount,
      cost: actualCost,
      margin,
      marginPercent
    };
  });

  // Total profitability metrics
  const totalRevenue = completedProjects.reduce((s, p) => s + (p.contract_amount || 0), 0);
  const totalCost = projectProfitability.reduce((s, p) => s + p.cost, 0);
  const totalMargin = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

  // Revenue distribution
  const revenueByStatus = [
    { name: 'Active', value: projects.filter(p => !['completed', 'warranty'].includes(p.status)).reduce((s, p) => s + (p.contract_amount || 0), 0) },
    { name: 'Completed', value: totalRevenue }
  ];

  // Average margin by tier
  const tierMargins = ['economy', 'standard', 'premium'].map(tier => {
    const tierBids = bids.filter(b => b.bid_tier === tier);
    const avgMargin = tierBids.length ? Math.round(tierBids.reduce((s, b) => s + (b.bid_amount - (b.materials_cost + b.labor_cost) || 0), 0) / tierBids.length) : 0;
    return { tier: tier.charAt(0).toUpperCase() + tier.slice(1), margin: avgMargin, count: tierBids.length };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Total Cost</p>
            <p className="text-2xl font-bold text-slate-900">${totalCost.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Profit Margin</p>
            <p className="text-2xl font-bold text-emerald-600">{marginPercent}%</p>
            <p className="text-xs text-slate-400 mt-1">${totalMargin.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Profitability</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProfitability.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar dataKey="cost" fill="#ef4444" name="Cost" />
              <Bar dataKey="margin" fill="#10b981" name="Margin" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Margin by Pricing Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tierMargins.map(item => (
              <div key={item.tier} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.tier}</p>
                  <p className="text-xs text-slate-500">{item.count} projects</p>
                </div>
                <p className="text-lg font-bold text-slate-900">${item.margin.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}