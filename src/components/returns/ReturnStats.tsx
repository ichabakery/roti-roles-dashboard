
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { fetchReturns } from '@/services/returnService';
import { Return } from '@/types/products';

export const ReturnStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const returns = await fetchReturns();
      const statsData = {
        total: returns.length,
        pending: returns.filter(r => r.status === 'pending').length,
        approved: returns.filter(r => r.status === 'approved').length,
        rejected: returns.filter(r => r.status === 'rejected').length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error loading return stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Retur',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Menunggu Persetujuan',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Disetujui',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Ditolak',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
