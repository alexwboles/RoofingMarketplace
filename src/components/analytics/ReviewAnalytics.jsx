import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Star } from 'lucide-react';

export default function ReviewAnalytics({ reviews, roofer, projects }) {
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0;
  const totalReviews = reviews.length;
  
  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    stars: `${rating}★`,
    count: reviews.filter(r => r.rating === rating).length
  }));

  // Category ratings
  const categoryRatings = [
    {
      category: 'Quality',
      avg: reviews.length ? (reviews.reduce((s, r) => s + (r.quality_rating || 0), 0) / reviews.length).toFixed(1) : 0,
      max: 5
    },
    {
      category: 'Communication',
      avg: reviews.length ? (reviews.reduce((s, r) => s + (r.communication_rating || 0), 0) / reviews.length).toFixed(1) : 0,
      max: 5
    },
    {
      category: 'Timeliness',
      avg: reviews.length ? (reviews.reduce((s, r) => s + (r.timeliness_rating || 0), 0) / reviews.length).toFixed(1) : 0,
      max: 5
    },
    {
      category: 'Value',
      avg: reviews.length ? (reviews.reduce((s, r) => s + (r.value_rating || 0), 0) / reviews.length).toFixed(1) : 0,
      max: 5
    }
  ];

  // Review sentiment trend
  const reviewTrend = reviews
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-6)
    .map((r, idx) => ({
      review: `Review ${idx + 1}`,
      rating: r.rating || 0
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{avgRating}</p>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{totalReviews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500 mb-2">Completed Projects</p>
            <p className="text-2xl font-bold text-slate-900">{projects.filter(p => ['completed', 'warranty'].includes(p.status)).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stars" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={categoryRatings}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              <Radar name="Rating" dataKey="avg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryRatings.map(item => (
              <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm font-medium text-slate-900">{item.category}</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(item.avg / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-900 w-8">{item.avg}/5</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}