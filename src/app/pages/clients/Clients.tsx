import React, { useState, useEffect } from 'react';
import {
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Button,
	Box,
	TextField,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	TablePagination,
	CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import NewClientDialog from './NewClientDialog';
import { clientApi, fetchJson } from '@/utils/authFetch';

interface Client {
	_id: string;
	name: string;
	contactInfo: {
		email: string;
		phone: string;
		primaryContact?: string;
		secondaryContact?: string;
		address: {
			street?: string;
			city?: string;
			state?: string;
			zipCode?: string;
			country: string;
		};
	};
	location: string;
	practiceDetails: {
		practiceType?: string;
		numberOfProviders?: number;
		specialties?: string[];
		establishedDate?: string;
		licenseNumber?: string;
	};
	industryType: 'Dental' | 'Medical' | 'Veterinary' | 'Other';
	status: 'Prospect' | 'Active' | 'Inactive' | 'Churned';
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	notes?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

function Clients() {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [showNewClientDialog, setShowNewClientDialog] = useState(false);

	// Filters
	const [statusFilter, setStatusFilter] = useState('');
	const [priorityFilter, setPriorityFilter] = useState('');
	const [industryFilter, setIndustryFilter] = useState('');
	const [searchTerm, setSearchTerm] = useState('');

	// Pagination
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		fetchClients();
	}, []);

	const fetchClients = async () => {
		try {
			setLoading(true);
			const response = await clientApi.getAll();
			const data = await fetchJson(response);
			setClients(data);
		} catch (error) {
			console.error('Error fetching clients:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		const colors = {
			'Prospect': 'info',
			'Active': 'success',
			'Inactive': 'warning',
			'Churned': 'error'
		};
		return colors[status as keyof typeof colors] || 'default';
	};

	const getPriorityColor = (priority: string) => {
		const colors = {
			'Low': 'success',
			'Medium': 'info',
			'High': 'warning',
			'Critical': 'error'
		};
		return colors[priority as keyof typeof colors] || 'default';
	};

	const getIndustryColor = (industry: string) => {
		const colors = {
			'Dental': 'primary',
			'Medical': 'secondary',
			'Veterinary': 'info',
			'Other': 'default'
		};
		return colors[industry as keyof typeof colors] || 'default';
	};

	const handlePageChange = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleNewClientSuccess = () => {
		fetchClients(); // Refresh the list
	};

	// Filter clients based on search and filters
	const filteredClients = clients.filter(client => {
		const matchesSearch = searchTerm === '' || 
			client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.contactInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.location.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesStatus = statusFilter === '' || client.status === statusFilter;
		const matchesPriority = priorityFilter === '' || client.priority === priorityFilter;
		const matchesIndustry = industryFilter === '' || client.industryType === industryFilter;
		
		return matchesSearch && matchesStatus && matchesPriority && matchesIndustry;
	});

	// Paginate filtered clients
	const paginatedClients = filteredClients.slice(
		page * rowsPerPage,
		page * rowsPerPage + rowsPerPage
	);

	return (
		<>
			<div className="w-full">
				{/* Content */}
				<div className="w-full p-5">
					{/* Filters */}
					<Box className="mb-10 flex flex-wrap gap-2">
						<TextField
							placeholder="Search clients..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="min-w-50"
							size="small"
						/>
						<FormControl className="min-w-50" size="small">
							<InputLabel>Status</InputLabel>
							<Select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								label="Status"
							>
								<MenuItem value="">All</MenuItem>
								<MenuItem value="Prospect">Prospect</MenuItem>
								<MenuItem value="Active">Active</MenuItem>
								<MenuItem value="Inactive">Inactive</MenuItem>
								<MenuItem value="Churned">Churned</MenuItem>
							</Select>
						</FormControl>
						<FormControl className="min-w-50" size="small">
							<InputLabel>Priority</InputLabel>
							<Select
								value={priorityFilter}
								onChange={(e) => setPriorityFilter(e.target.value)}
								label="Priority"
							>
								<MenuItem value="">All</MenuItem>
								<MenuItem value="Low">Low</MenuItem>
								<MenuItem value="Medium">Medium</MenuItem>
								<MenuItem value="High">High</MenuItem>
								<MenuItem value="Critical">Critical</MenuItem>
							</Select>
						</FormControl>
						<FormControl className="min-w-50" size="small">
							<InputLabel>Industry</InputLabel>
							<Select
								value={industryFilter}
								onChange={(e) => setIndustryFilter(e.target.value)}
								label="Industry"
							>
								<MenuItem value="">All</MenuItem>
								<MenuItem value="Dental">Dental</MenuItem>
								<MenuItem value="Medical">Medical</MenuItem>
								<MenuItem value="Veterinary">Veterinary</MenuItem>
								<MenuItem value="Other">Other</MenuItem>
							</Select>
						</FormControl>
						<Button
							variant="contained"
							color="primary"
							startIcon={<AddIcon />}
							size="small"
							onClick={() => setShowNewClientDialog(true)}
						>
							New Client
						</Button>
					</Box>

					{/* Clients Table */}
					<div className="w-full">
						<TableContainer>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Name</TableCell>
										<TableCell>Email</TableCell>
										<TableCell>Phone</TableCell>
										<TableCell>Location</TableCell>
										<TableCell>Industry</TableCell>
										<TableCell>Status</TableCell>
										<TableCell>Priority</TableCell>
										<TableCell>Created</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell colSpan={8} align="center">
												<CircularProgress />
											</TableCell>
										</TableRow>
									) : paginatedClients.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} align="center">
												<Typography color="text.secondary">
													No clients found
												</Typography>
											</TableCell>
										</TableRow>
									) : (
										paginatedClients.map((client) => (
											<TableRow key={client._id} hover>
												<TableCell>
													<Typography variant="body2" className="font-medium">
														{client.name}
													</Typography>
													{client.contactInfo.primaryContact && (
														<Typography variant="caption" color="text.secondary">
															Contact: {client.contactInfo.primaryContact}
														</Typography>
													)}
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{client.contactInfo.email}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{client.contactInfo.phone}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{client.location}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														label={client.industryType}
														color={getIndustryColor(client.industryType) as any}
														size="small"
													/>
												</TableCell>
												<TableCell>
													<Chip
														label={client.status}
														color={getStatusColor(client.status) as any}
														size="small"
													/>
												</TableCell>
												<TableCell>
													<Chip
														label={client.priority}
														color={getPriorityColor(client.priority) as any}
														size="small"
													/>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{new Date(client.createdAt).toLocaleDateString()}
													</Typography>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={filteredClients.length}
							page={page}
							onPageChange={handlePageChange}
							rowsPerPage={rowsPerPage}
							onRowsPerPageChange={handleRowsPerPageChange}
							rowsPerPageOptions={[5, 10, 25, 50]}
						/>
					</div>
				</div>
			</div>

			{/* New Client Dialog */}
			<NewClientDialog
				open={showNewClientDialog}
				onClose={() => setShowNewClientDialog(false)}
				onSuccess={handleNewClientSuccess}
			/>
		</>
	);
}

export default Clients;
