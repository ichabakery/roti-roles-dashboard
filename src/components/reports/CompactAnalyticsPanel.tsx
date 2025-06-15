
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard } from 'lucide-react';
import type { TransactionSummary, ProductSummary, PaymentMethodSummary } from '@/types/reports';

interface CompactAnalyticsPanelProps {
  branchSummary: TransactionSummary[];
  productSummary: ProductSummary[];
  paymentSummary: PaymentMethodSummary[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CompactAnalyticsPanel: React.FC<CompactAnalyticsPanelProps> = ({
  branchSummary,
  productSummary,
  paymentSummary
}) => {
  const totalRevenue = branchSummary.reduce((sum, branch) => sum + branch.total_revenue, 0);
  const totalTransactions = branchSummary.reduce((sum, branch) => sum + branch.total_transactions, 0);
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const topProducts = productSummary.slice(0, 5);
  
  const chartConfig = {
    revenue: { label: "Pendapatan", color: "#2563eb" },
    quantity: { label: "Kuantitas", color: "#60a5fa" }
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 space-y-4 overflow-y-auto">
      {/* Key Metrics */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Ringkasan Periode
        </h3>
        
        <div className="grid gap-2">
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Total Pendapatan</div>
                <div className="font-bold text-green-600">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Total Transaksi</div>
                <div className="font-bold text-blue-600">{totalTransactions}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Rata-rata Transaksi</div>
                <div className="font-bold text-purple-600">
                  Rp {Math.round(avgTransaction).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Chart */}
      {paymentSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-32">
              <PieChart>
                <Pie
                  data={paymentSummary}
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  fill="#8884d8"
                  dataKey="total_amount"
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
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[120px]" title={product.product_name}>
                      {product.product_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.total_quantity}</div>
                    <div className="text-gray-500">
                      Rp {product.total_revenue.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branch Performance */}
      {branchSummary.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performa Cabang</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-32">
              <BarChart data={branchSummary.slice(0, 5)}>
                <XAxis 
                  dataKey="branch_name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Bar 
                  dataKey="total_revenue" 
                  fill="var(--color-revenue)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
