import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock } from 'lucide-react';

export default function ResponseTimeAnalytics({ leads, projects, appointments }) {
  // Calculate response time for each lead (time from lead creation to first contact)
  const responseTimeData = leads
    .filter(l => l.status !== 'new' || (l.created_date && new Date(l.created_date)))
    .map(l => {
      const createdDate = new Date(l.created_date);
      const statusChangeDate = new Date(l.updated_date);
      const hoursToRespond = Math.round((statusChangeDate - createdDate) / (1000 * 60 * 60));
      return {
        address: l.address?.split(',')[0] || 'Lead',
        hoursToRespond: Math.max(0, hoursToRespond),
        status: l.status
      };
    })
    .slice(-10);

  // Calculate average response time
  const avgResponseTime = responseTimeData.length
    ? Math.round(responseTimeData.reduce((s, r) => s + r.hoursToRespond, 0) / responseTimeData.length)
    : 0;

  // Appointment fulfillment rate
  const appointmentCompletion = appointments.length
    ? {
        scheduled: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      }
    : { scheduled: 0, completed: 0, cancelled: 0 };

  // Project timeline adherence
  const timelineAdherence = projects
    .filter(p => p.start_date && p.estimated_completion)
    .map(p => {
      const estimated = new Date(p.estimated_completion);
      const actual = p.actual_completion ? new Date(p.actual_completion) : new Date();
      const daysOverdue = Math.max(0, Math.round((actual - estimated) / (1000 * 60 * 60 * 24)));
      return {
        name: p.address?.split(',')[0] || 'Project',
        daysOverdue,
        status: p.status
      };
    })
    .slice(-8);

  const avgDaysOverdue = timelineAdherence.length
    ? Math.round(timelineAdherence.reduce((s, t) => s + t.daysOverdue, 0) / timelineAdherence.length)
    : 0;

  // Response time distribution
  const responseTimeDistribution = [
    { range: '< 1 hour', count: responseTimeData.filter(r => r.hoursToRespond < 1).length },
    { range: '1-4 hours', count: responseTimeData.filter(r => r.hoursToRespond >= 1 && r.hoursToRespond < 4).length },
    { range: '4-24 hours', count: responseTimeData.filter(r => r.hoursToRespond >= 4 && r.hoursToRespond < 24).length },
    { range: '> 24 hours', count: responseTimeData.filter(r => r.hoursToRespond >= 24).length }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Avg Response Time</p>
            <p className="text-2xl font-bold text-slate-900">{avgResponseTime}h</p>
            <p className="text-xs text-slate-400 mt-1">to first contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Appointments Completed</p>
            <p className="text-2xl font-bold text-slate-900">{appointmentCompletion.completed}</p>
            <p className="text-xs text-slate-400 mt-1">{appointmentCompletion.scheduled} scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Avg Days Overdue</p>
            <p className="text-2xl font-bold text-slate-900">{avgDaysOverdue}</p>
            <p className="text-xs text-slate-400 mt-1">on projects</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="address" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="hoursToRespond" fill="#3b82f6" name="Hours to Respond" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" name="Lead Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Timeline Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineAdherence}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Days Overdue', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="daysOverdue" stroke="#ef4444" name="Days Overdue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}