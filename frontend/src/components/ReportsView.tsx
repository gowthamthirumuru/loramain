import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { FileText, Download, Filter, Calendar as CalendarIcon, Search, BarChart3, TrendingUp, Users, AlertTriangle, Plus, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReportsView() {
  const [dateRange, setDateRange] = useState('7d');
  const [reportType, setReportType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [generatingReports, setGeneratingReports] = useState<number[]>([]);

  const reportTemplates = [
    { id: 1, name: 'Daily Incident Summary', description: 'Summary of all incidents reported in the last 24 hours', type: 'incident', frequency: 'Daily', lastGenerated: '2 hours ago', size: '2.3 MB' },
    { id: 2, name: 'Weekly Safety Analysis', description: 'Comprehensive safety analysis including trends and patterns', type: 'analysis', frequency: 'Weekly', lastGenerated: '1 day ago', size: '4.7 MB' },
    { id: 3, name: 'Monthly Tourist Flow Report', description: 'Tourist arrival statistics and demographic analysis', type: 'tourism', frequency: 'Monthly', lastGenerated: '3 days ago', size: '6.1 MB' },
    { id: 4, name: 'Response Team Performance', description: 'Performance metrics for all response teams', type: 'performance', frequency: 'Weekly', lastGenerated: '5 hours ago', size: '1.8 MB' },
    { id: 5, name: 'Risk Assessment Report', description: 'Risk analysis by location and threat category', type: 'risk', frequency: 'Monthly', lastGenerated: '1 week ago', size: '3.2 MB' }
  ];

  const [customReports, setCustomReports] = useState([
    { id: 1, name: 'Q4 Incident Analysis', description: 'Custom analysis of Q4 incidents', type: 'custom', createdBy: 'Admin', dateRange: 'Oct 1 - Dec 31, 2023', status: 'completed', size: '8.4 MB' },
    { id: 2, name: 'Embassy Communication Report', description: 'Report on embassy communications', type: 'custom', createdBy: 'Supervisor', dateRange: 'Last 30 days', status: 'processing', size: 'Processing...' }
  ]);

  const [recentReports, setRecentReports] = useState([
    { id: 1, name: 'Daily Incident Summary - Sept 13', type: 'incident', generated: '2 hours ago', size: '2.3 MB', downloads: 12 },
    { id: 2, name: 'Weekly Safety Analysis - Week 37', type: 'analysis', generated: '1 day ago', size: '4.7 MB', downloads: 28 },
    { id: 3, name: 'Response Team Performance - Sept', type: 'performance', generated: '2 days ago', size: '1.8 MB', downloads: 15 }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'analysis': return <BarChart3 className="w-4 h-4 text-cyan-500" />;
      case 'tourism': return <Users className="w-4 h-4 text-amber-500" />;
      case 'performance': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-neutral-500" />;
    }
  };

  const handleGenerateReport = (reportId: number, reportName: string) => {
    setGeneratingReports(prev => [...prev, reportId]);
    toast.loading(`Generating ${reportName}...`, { id: `gen-${reportId}` });

    setTimeout(() => {
      setGeneratingReports(prev => prev.filter(id => id !== reportId));
      toast.success(`${reportName} generated!`, {
        id: `gen-${reportId}`,
        description: 'Report is ready for download'
      });

      // Add to recent reports
      setRecentReports(prev => [{
        id: Date.now(),
        name: `${reportName} - ${new Date().toLocaleDateString()}`,
        type: reportTemplates.find(t => t.id === reportId)?.type || 'custom',
        generated: 'Just now',
        size: reportTemplates.find(t => t.id === reportId)?.size || '2.0 MB',
        downloads: 0
      }, ...prev]);
    }, 2000);
  };

  const handleDownloadReport = (reportName: string, reportId: number) => {
    toast.success(`Downloading ${reportName}`, {
      description: 'Your download will begin shortly'
    });
    // Update download count
    setRecentReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, downloads: r.downloads + 1 } : r
    ));
  };

  const handleViewReport = (reportName: string) => {
    toast.info(`Opening ${reportName}`, {
      description: 'Report viewer loading...'
    });
  };

  const handleDeleteReport = (reportId: number, reportName: string) => {
    setRecentReports(prev => prev.filter(r => r.id !== reportId));
    toast.success(`${reportName} deleted`);
  };

  const handleCreateCustomReport = () => {
    toast.info('Create Custom Report', {
      description: 'Opening report builder...'
    });

    // Simulate adding a new custom report
    const newReport = {
      id: Date.now(),
      name: `Custom Report - ${new Date().toLocaleDateString()}`,
      description: 'New custom report',
      type: 'custom',
      createdBy: 'You',
      dateRange: dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Custom',
      status: 'processing',
      size: 'Processing...'
    };
    setCustomReports(prev => [newReport, ...prev]);

    // Simulate completion
    setTimeout(() => {
      setCustomReports(prev => prev.map(r =>
        r.id === newReport.id ? { ...r, status: 'completed', size: '3.5 MB' } : r
      ));
      toast.success('Custom report generated!');
    }, 3000);
  };

  const filteredTemplates = useMemo(() =>
    reportTemplates.filter(t =>
      (reportType === 'all' || t.type === reportType) &&
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [reportType, searchTerm]
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-neutral-900">Reports Center</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Generate, manage, and download safety reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              toast.info(`Date range set to ${e.target.options[e.target.selectedIndex].text}`);
            }}
            className="h-9 px-3 text-sm border border-neutral-300 rounded-md bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            className="bg-cyan-600 hover:bg-cyan-700 h-9 text-xs"
            onClick={handleCreateCustomReport}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Custom Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-neutral-100 p-1 rounded-lg w-fit">
        {[
          { id: 'templates', label: 'Report Templates' },
          { id: 'custom', label: 'Custom Reports' },
          { id: 'recent', label: 'Recent Downloads' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-9 px-3 text-sm border border-neutral-300 rounded-md bg-white"
            >
              <option value="all">All Types</option>
              <option value="incident">Incident</option>
              <option value="analysis">Analysis</option>
              <option value="tourism">Tourism</option>
              <option value="performance">Performance</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    {getTypeIcon(template.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-neutral-900">{template.name}</h4>
                    <Badge variant="outline" className="text-xs mt-1">{template.frequency}</Badge>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                  <span>Last: {template.lastGenerated}</span>
                  <span>{template.size}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-8 text-xs"
                    onClick={() => handleGenerateReport(template.id, template.name)}
                    disabled={generatingReports.includes(template.id)}
                  >
                    {generatingReports.includes(template.id) ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3 mr-1" />
                    )}
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleDownloadReport(template.name, template.id)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Reports Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {customReports.map((report) => (
            <Card key={report.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-neutral-100 rounded-lg">
                    <FileText className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900">{report.name}</h4>
                    <p className="text-xs text-neutral-600 mt-1">{report.description}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-neutral-500">
                      <span>By: {report.createdBy}</span>
                      <span>•</span>
                      <span>{report.dateRange}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={report.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {report.status}
                  </Badge>
                  {report.status === 'completed' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleViewReport(report.name)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700 h-8 text-xs"
                        onClick={() => handleDownloadReport(report.name, report.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Downloads Tab */}
      {activeTab === 'recent' && (
        <Card>
          <div className="divide-y divide-neutral-200">
            {recentReports.map((report) => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(report.type)}
                  <div>
                    <h4 className="text-sm text-neutral-900">{report.name}</h4>
                    <p className="text-xs text-neutral-500">{report.generated} • {report.size} • {report.downloads} downloads</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleViewReport(report.name)}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 h-8 text-xs"
                    onClick={() => handleDownloadReport(report.name, report.id)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteReport(report.id, report.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}