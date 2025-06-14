
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

interface PaymentMethodSummary {
  payment_method: string;
  count: number;
  total_amount: number;
}

interface ProductSummary {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface Transaction {
  id: string;
  transaction_date: string;
  total_amount: number;
}

interface ReportsChartsProps {
  paymentSummary: PaymentMethodSummary[];
  productSummary: ProductSummary[];
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ReportsCharts: React.FC<ReportsChartsProps> = ({
  paymentSummary,
  productSummary,
  transactions
}) => {
  // Prepare daily revenue data
  const dailyRevenue = React.useMemo(() => {
    const revenueByDate = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date).toLocaleDateString('id-ID');
      const current = revenueByDate.get(date) || 0;
      revenueByDate.set(date, current + transaction.total_amount);
    });

    return Array.from(revenueByDate.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }, [transactions]);

  const chartConfig = {
    revenue: {
      label: "Pendapatan",
      color: "#2563eb",
    },
    quantity: {
      label: "Kuantitas",
      color: "#60a5fa",
    },
    count: {
      label: "Jumlah",
      color: "#34d399",
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Daily Revenue Trend */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Tren Pendapatan Harian (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-revenue)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-revenue)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Payment Methods Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={paymentSummary}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_amount"
                label={({ payment_method, percent }) => 
                  `${payment_method}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {paymentSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total']}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Products by Revenue */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Produk Terlaris (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={productSummary.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="product_name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Bar 
                dataKey="total_revenue" 
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
