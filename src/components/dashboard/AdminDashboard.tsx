import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  FileText,
  Zap
} from 'lucide-react';

export const AdminDashboard = () => {
  const { kpis, userAlerts, loading } = useAdminDashboard();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peran & Cabang</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.rolesAndBranches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tugas Admin</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.openTasks}</div>
            <p className="text-xs text-muted-foreground">Terbuka</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Integrasi</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {kpis.integrationStatus ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Online</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Error</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/users')}>
              <Users className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
            <Button variant="outline" onClick={() => navigate('/branches')}>
              <MapPin className="mr-2 h-4 w-4" />
              Kelola Cabang
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <FileText className="mr-2 h-4 w-4" />
              Audit Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Peringatan Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userAlerts.length > 0 ? (
            <div className="space-y-3">
              {userAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{alert.user_name}</p>
                    <p className="text-sm text-muted-foreground">{alert.issue}</p>
                  </div>
                  <Badge variant={alert.severity === 'error' ? "destructive" : "secondary"}>
                    {alert.severity === 'error' ? 'Error' : 'Warning'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Semua pengguna terkonfigurasi dengan benar</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};