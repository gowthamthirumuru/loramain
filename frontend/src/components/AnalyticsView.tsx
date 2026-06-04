import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Download, AlertTriangle, Users, Clock, CheckCircle2, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('incidents');
  const [isLoading, setIsLoading] = useState(false);

  const incidentTrends = useMemo(() => [
    { date: 'Mon', incidents: 12, resolved: 10, responseTime: 8.5 },
    { date: 'Tue', incidents: 15, resolved: 13, responseTime: 7.2 },
    { date: 'Wed', incidents: 8, resolved: 8, responseTime: 6.8 },
    { date: 'Thu', incidents: 18, resolved: 15, responseTime: 9.1 },
    { date: 'Fri', incidents: 22, resolved: 19, responseTime: 8.9 },
    { date: 'Sat', incidents: 11, resolved: 11, responseTime: 7.5 },
    { date: 'Sun', incidents: 16, resolved: 14, responseTime: 8.2 },
  ], []);

  const touristFlowData = useMemo(() => [
    { month: 'Jan', domestic: 2500, international: 1200 },
    { month: 'Feb', domestic: 2800, international: 1400 },
    { month: 'Mar', domestic: 3200, international: 1800 },
    { month: 'Apr', domestic: 2900, international: 1600 },
    { month: 'May', domestic: 3500, international: 2000 },
    { month: 'Jun', domestic: 4000, international: 2200 },
  ], []);

  const incidentCategories = useMemo(() => [
    { name: 'Theft/Robbery', value: 35, trend: '+5%', color: '#dc2626' },
    { name: 'Medical Emergency', value: 25, trend: '-2%', color: '#f59e0b' },
    { name: 'Lost/Missing', value: 20, trend: '+8%', color: '#0891b2' },
    { name: 'Scam/Fraud', value: 12, trend: '+12%', color: '#8b5cf6' },
    { name: 'Other', value: 8, trend: '-3%', color: '#10b981' },
  ], []);

  const keyMetrics = [
    { title: 'Total Incidents', value: '2,847', change: '+12.5%', trend: 'up', icon: AlertTriangle, bgColor: 'bg-red-50', iconColor: 'text-red-600', borderColor: 'border-red-200' },
    { title: 'Resolution Rate', value: '94.2%', change: '+2.1%', trend: 'up', icon: CheckCircle2, bgColor: 'bg-green-50', iconColor: 'text-green-600', borderColor: 'border-green-200' },
    { title: 'Avg Response Time', value: '7.2 min', change: '-0.8 min', trend: 'down', icon: Clock, bgColor: 'bg-cyan-50', iconColor: 'text-cyan-600', borderColor: 'border-cyan-200' },
    { title: 'Tourist Satisfaction', value: '4.6/5', change: '+0.2', trend: 'up', icon: Users, bgColor: 'bg-neutral-50', iconColor: 'text-neutral-600', borderColor: 'border-neutral-200' }
  ];

  const handleExportReport = () => {
    setIsLoading(true);
    toast.loading('Generating report...', { id: 'export' });
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Report exported successfully!', {
        id: 'export',
        description: `Analytics_${timeRange}_${new Date().toLocaleDateString()}.pdf`
      });
    }, 1500);
  };

  const handleCustomRange = () => {
    toast.info('Custom date range', {
      description: 'Opening date picker...'
    });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    toast.loading('Refreshing data...', { id: 'refresh' });
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Data refreshed!', { id: 'refresh' });
    }, 1000);
  };

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
    toast.info(`Showing data for ${e.target.options[e.target.selectedIndex].text}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-neutral-900">Analytics Dashboard</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="h-9 px-3 text-sm border border-neutral-300 rounded-md bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            variant="outline"
            className="h-9 text-xs border-neutral-300"
            onClick={handleCustomRange}
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Custom Range
          </Button>
          <Button
            variant="outline"
            className="h-9 text-xs border-neutral-300"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            className="bg-cyan-600 hover:bg-cyan-700 h-9 text-xs"
            onClick={handleExportReport}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={index} className={`p-4 border ${metric.borderColor} ${metric.bgColor} cursor-pointer hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-white shadow-sm ${metric.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`flex items-center text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-cyan-600'}`}>
                  <TrendIcon className="w-3 h-3 mr-1" />
                  {metric.change}
                </div>
              </div>
              <p className="text-xs text-neutral-600 mb-1">{metric.title}</p>
              <p className="text-2xl text-neutral-900">{metric.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-neutral-100 p-1 rounded-lg w-fit">
          {['incidents', 'tourism', 'response', 'categories'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              {tab === 'incidents' ? 'Incident Analysis' :
                tab === 'tourism' ? 'Tourism Flow' :
                  tab === 'response' ? 'Response Times' : 'Categories'}
            </button>
          ))}
        </div>

        {/* Charts */}
        <Card className="p-6">
          {activeTab === 'incidents' && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Weekly Incident Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incidentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#dc2626" name="Incidents" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'tourism' && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Tourist Flow Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={touristFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="domestic" stackId="1" stroke="#0891b2" fill="#cffafe" name="Domestic" />
                  <Area type="monotone" dataKey="international" stackId="1" stroke="#f59e0b" fill="#fef3c7" name="International" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'response' && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Response Time Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={incidentTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[5, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="responseTime" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} name="Response Time (min)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Incident Categories</h3>
              <div className="grid grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={incidentCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {incidentCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {incidentCategories.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm text-neutral-900">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">{cat.value}%</span>
                        <Badge variant={cat.trend.startsWith('+') ? 'destructive' : 'default'} className="text-xs">
                          {cat.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
