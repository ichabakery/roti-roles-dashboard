
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UnifiedReportsLayout } from '@/components/reports/UnifiedReportsLayout';

const Reports = () => {
  return (
    <DashboardLayout>
      <UnifiedReportsLayout />
    </DashboardLayout>
  );
};

export default Reports;
