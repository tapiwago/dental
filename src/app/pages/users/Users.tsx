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
  IconButton,
  Chip,
  Tooltip,
  Alert,
  TablePagination,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { userApi, fetchJson } from '@/utils/apiFetch';
import NewUserDialog from './NewUserDialog';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  role: 'Admin' | 'Champion' | 'Team Member' | 'Senior Champion';
  isActive: boolean;
  lastLogin?: string;
  profilePicture?: string;
  department?: string;
  skills?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const roles = ['Admin', 'Champion', 'Team Member', 'Senior Champion'];
  const departments = ['Operations', 'Clinical', 'Administrative', 'IT', 'Marketing', 'Finance'];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    alert(111111111)
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedDepartment, activeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      alert(123)
      
      const response = await userApi.getAll();
      const data = await fetchJson(response);
      
      setUsers(data.users || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.data?.error || err.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(user => user.department === selectedDepartment);
    }

    // Active status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => 
        activeFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page when filtering
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await userApi.delete(user.id);
      
      // Refresh users list
      await fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.data?.error || err.message || 'Failed to delete user. Please try again.');
    }
  };

  const handleUserCreated = () => {
    fetchUsers();
    setNewUserDialogOpen(false);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Senior Champion':
        return 'warning';
      case 'Champion':
        return 'info';
      case 'Team Member':
        return 'success';
      default:
        return 'default';
    }
  };

  const getFullName = (user: User) => {
    const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
    return parts.join(' ');
  };

  const getInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Department', 'Status', 'Last Login', 'Created'],
      ...filteredUsers.map(user => [
        getFullName(user),
        user.email || '',
        user.phone || '',
        user.role,
        user.department || '',
        user.isActive ? 'Active' : 'Inactive',
        formatLastLogin(user.lastLogin),
        formatDate(user.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading users...</Typography>
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
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage user accounts, roles, and permissions
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportUsers}
              disabled={filteredUsers.length === 0}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setNewUserDialogOpen(true)}
            >
              Add User
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        <Stack direction="row" spacing={3}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{users.length}</Typography>
            <Typography variant="body2">Total Users</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{users.filter(u => u.isActive).length}</Typography>
            <Typography variant="body2">Active Users</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{users.filter(u => u.role === 'Admin').length}</Typography>
            <Typography variant="body2">Administrators</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1, minWidth: 120 }}>
            <Typography variant="h4">{users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</Typography>
            <Typography variant="body2">Active This Week</Typography>
          </Box>
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              label="Department"
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={activeFilter}
              label="Status"
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="inactive">Inactive Only</MenuItem>
            </Select>
          </FormControl>

          {(searchTerm || selectedRole !== 'all' || selectedDepartment !== 'all' || activeFilter !== 'all') && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('all');
                setSelectedDepartment('all');
                setActiveFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Users Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={user.profilePicture}
                        sx={{ width: 40, height: 40 }}
                      >
                        {getInitials(user)}
                      </Avatar>
                      <Stack>
                        <Typography variant="subtitle2">
                          {getFullName(user)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user.id.slice(-8)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack>
                      {user.email && (
                        <Typography variant="body2">{user.email}</Typography>
                      )}
                      {user.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {user.phone}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.department || 'Not assigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatLastLogin(user.lastLogin)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {user.skills && user.skills.length > 0 ? (
                        user.skills.slice(0, 2).map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No skills
                        </Typography>
                      )}
                      {user.skills && user.skills.length > 2 && (
                        <Chip
                          label={`+${user.skills.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => console.log('Edit user:', user.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(user)}
                          disabled={user.role === 'Admin'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Stack>

      {/* New User Dialog */}
      <NewUserDialog
        open={newUserDialogOpen}
        onClose={() => setNewUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate user "{userToDelete ? getFullName(userToDelete) : ''}"?
            This action will make the user unable to access the system but will preserve their data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => userToDelete && handleDeleteUser(userToDelete)}
            color="error"
            variant="contained"
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
