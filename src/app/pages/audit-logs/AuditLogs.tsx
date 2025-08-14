import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Alert,
  TablePagination,
  Avatar,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { auditApi } from '@/utils/apiFetch';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const actionTypes = [
  'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
  'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'UNASSIGN'
];

const resourceTypes = [
  'USER', 'CLIENT', 'ONBOARDING_CASE', 'WORKFLOW_TEMPLATE', 
  'SYSTEM', 'AUTHENTICATION', 'PERMISSIONS', 'DATA_EXPORT'
];

const severityTypes = ['low', 'medium', 'high', 'critical'];

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, selectedAction, selectedResource, selectedSeverity, selectedUser, startDate, endDate]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getAll();
      setAuditLogs(response.auditLogs || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      // Fallback to mock data if API is not available
      const mockData: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          userId: 'user-1',
          userName: 'John Doe',
          userRole: 'Admin',
          action: 'LOGIN',
          resource: 'AUTHENTICATION',
          description: 'User logged into the system',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'low',
          details: { method: 'password', location: 'New York, NY' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          userId: 'user-2',
          userName: 'Jane Smith',
          userRole: 'Champion',
          action: 'CREATE',
          resource: 'CLIENT',
          resourceId: 'client-123',
          description: 'Created new client record',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          severity: 'medium',
          details: { clientName: 'ABC Dental Clinic', clientType: 'Practice' }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          userId: 'user-3',
          userName: 'Mike Johnson',
          userRole: 'Team Member',
          action: 'UPDATE',
          resource: 'ONBOARDING_CASE',
          resourceId: 'case-456',
          description: 'Updated onboarding case status to "In Progress"',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          severity: 'low'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          userId: 'user-1',
          userName: 'John Doe',
          userRole: 'Admin',
          action: 'DELETE',
          resource: 'USER',
          resourceId: 'user-999',
          description: 'Deactivated user account',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'high',
          details: { reason: 'Security violation', deletedBy: 'John Doe' }
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          userId: 'user-4',
          userName: 'Sarah Wilson',
          userRole: 'Senior Champion',
          action: 'EXPORT',
          resource: 'DATA_EXPORT',
          description: 'Exported client data to CSV',
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'medium',
          details: { exportType: 'CSV', recordCount: 150 }
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          userId: 'user-5',
          userName: 'System',
          userRole: 'System',
          action: 'UPDATE',
          resource: 'SYSTEM',
          description: 'System configuration updated',
          ipAddress: '127.0.0.1',
          userAgent: 'System/Internal',
          severity: 'critical',
          details: { configKey: 'security.maxLoginAttempts', oldValue: 3, newValue: 5 }
        }
      ];
      setAuditLogs(mockData);
      setError('Using demo data - Connect to backend API for real audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm)
      );
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Resource filter
    if (selectedResource !== 'all') {
      filtered = filtered.filter(log => log.resource === selectedResource);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === selectedSeverity);
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.userId === selectedUser);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    setFilteredLogs(filtered);
    setPage(0); // Reset to first page when filtering
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'success';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return <SecurityIcon fontSize="small" />;
      case 'CREATE':
      case 'UPDATE':
      case 'DELETE':
        return <SettingsIcon fontSize="small" />;
      case 'EXPORT':
      case 'IMPORT':
        return <DownloadIcon fontSize="small" />;
      default:
        return <HistoryIcon fontSize="small" />;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'USER':
        return <PersonIcon fontSize="small" />;
      case 'CLIENT':
      case 'ONBOARDING_CASE':
        return <BusinessIcon fontSize="small" />;
      default:
        return <SettingsIcon fontSize="small" />;
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Description', 'IP Address', 'Severity'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.userName,
        log.userRole,
        log.action,
        log.resource,
        log.description,
        log.ipAddress,
        log.severity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAction('all');
    setSelectedResource('all');
    setSelectedSeverity('all');
    setSelectedUser('all');
    setStartDate(null);
    setEndDate(null);
  };

  const hasFilters = searchTerm || selectedAction !== 'all' || selectedResource !== 'all' || 
                   selectedSeverity !== 'all' || selectedUser !== 'all' || startDate || endDate;

  const openDetailsDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get unique users for filter dropdown
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.userId)))
    .map(userId => {
      const log = auditLogs.find(l => l.userId === userId);
      return { id: userId, name: log?.userName || 'Unknown' };
    });

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading audit logs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h4" component="h1" gutterBottom>
              Audit Logs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor system activities and user actions
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
            >
              Export Logs
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        <Stack direction="row" spacing={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{auditLogs.length}</Typography>
            <Typography variant="body2">Total Entries</Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{auditLogs.filter(l => l.severity === 'critical').length}</Typography>
            <Typography variant="body2">Critical Events</Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{auditLogs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}</Typography>
            <Typography variant="body2">Last 24 Hours</Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{new Set(auditLogs.map(l => l.userId)).size}</Typography>
            <Typography variant="body2">Active Users</Typography>
          </Paper>
        </Stack>

        {/* Filters */}
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon />
              Filters
            </Typography>
            <Divider />
            
            {/* First row of filters */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={selectedAction}
                  label="Action"
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  {actionTypes.map((action) => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Resource</InputLabel>
                <Select
                  value={selectedResource}
                  label="Resource"
                  onChange={(e) => setSelectedResource(e.target.value)}
                >
                  <MenuItem value="all">All Resources</MenuItem>
                  {resourceTypes.map((resource) => (
                    <MenuItem key={resource} value={resource}>{resource}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={selectedSeverity}
                  label="Severity"
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  {severityTypes.map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>User</InputLabel>
                <Select
                  value={selectedUser}
                  label="User"
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {uniqueUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Second row - Date filters */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />

              {hasFilters && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Audit Logs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Stack>
                      <Typography variant="body2">
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(log.timestamp)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {log.userName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack>
                        <Typography variant="body2">{log.userName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.userRole}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getActionIcon(log.action)}
                      <Typography variant="body2">{log.action}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getResourceIcon(log.resource)}
                      <Typography variant="body2">{log.resource}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {log.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.severity.toUpperCase()}
                      color={getSeverityColor(log.severity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.ipAddress}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => openDetailsDialog(log)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Stack>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Timestamp:</Typography>
                <Typography>{formatTimestamp(selectedLog.timestamp)}</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>User:</Typography>
                <Typography>{selectedLog.userName} ({selectedLog.userRole})</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Action:</Typography>
                <Typography>{selectedLog.action}</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Resource:</Typography>
                <Typography>{selectedLog.resource}</Typography>
              </Stack>
              {selectedLog.resourceId && (
                <Stack direction="row" spacing={2}>
                  <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Resource ID:</Typography>
                  <Typography sx={{ fontFamily: 'monospace' }}>{selectedLog.resourceId}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Description:</Typography>
                <Typography>{selectedLog.description}</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>IP Address:</Typography>
                <Typography sx={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress}</Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>User Agent:</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {selectedLog.userAgent}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Severity:</Typography>
                <Chip
                  label={selectedLog.severity.toUpperCase()}
                  color={getSeverityColor(selectedLog.severity) as any}
                  size="small"
                />
              </Stack>
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Additional Details:</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ fontFamily: 'monospace', fontSize: '0.875rem', margin: 0 }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Paper>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}