import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useOrderCalendar } from '@/hooks/useOrderCalendar';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useAuth } from '@/contexts/AuthContext';

const OrderCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { userBranch } = useUserBranch();
  const { user } = useAuth();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  // Only show branch filter for non-owners
  const branchId = user?.role === 'owner' || user?.role === 'admin_pusat' 
    ? undefined 
    : userBranch.branchId;
    
  const { calendarData, loading } = useOrderCalendar(year, month, branchId);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatCurrency = (amount: number, isMobile: boolean = false) => {
    if (isMobile) {
      // Shorter format for mobile: Rp 1.5K, Rp 120K, etc.
      if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
      }
      return `Rp ${amount}`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_production: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Get days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // Create calendar grid
  const calendarGrid = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayData = calendarData.find(d => d.delivery_date === dateStr);
    calendarGrid.push({ day, data: dayData });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Kalender Pesanan
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-32 text-center">
              {currentDate.toLocaleDateString('id-ID', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 text-xs sm:text-sm font-medium text-center">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                <div key={day} className="p-1 sm:p-2 text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((cell, index) => (
                <div
                  key={index}
                  className={`min-h-16 sm:min-h-24 p-1 border border-border rounded ${
                    cell ? 'bg-background' : 'bg-muted/50'
                  }`}
                >
                  {cell && (
                    <div className="h-full flex flex-col">
                      <div className="text-xs sm:text-sm font-medium mb-1 flex-shrink-0">
                        {cell.day}
                      </div>
                      {cell.data && (
                        <div className="space-y-0.5 sm:space-y-1 flex-1 overflow-hidden">
                          <div className="text-[10px] sm:text-xs font-medium leading-tight">
                            {cell.data.order_count} pesanan
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                            <span className="sm:hidden">
                              {formatCurrency(cell.data.total_amount, true)}
                            </span>
                            <span className="hidden sm:inline">
                              {formatCurrency(cell.data.total_amount)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {cell.data.status_breakdown && Object.entries(cell.data.status_breakdown).map(([status, count]) => {
                              if ((count as number) > 0) {
                                return (
                                  <Badge
                                    key={status}
                                    variant="secondary"
                                    className={`text-[8px] sm:text-xs px-0.5 sm:px-1 py-0 h-4 sm:h-auto leading-none ${getStatusColor(status)}`}
                                  >
                                    {count as number}
                                  </Badge>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCalendar;