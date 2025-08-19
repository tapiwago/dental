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
	CircularProgress,
	IconButton
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import useNavigate from '@fuse/hooks/useNavigate';
import NewCaseDialog from './NewCaseDialog';
import { onboardingApi, fetchJson } from '@/utils/authFetch';

interface OnboardingCase {
	_id: string;
	caseId: string;
	workflowTypeId?: {
		_id: string;
		name: string;
		prefix: string;
	};
	clientId?: {
		_id: string;
		name: string;
		email: string;
	};
	status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	progress: number;
	startDate: string;
	expectedCompletionDate?: string;
	assignedChampion: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	createdAt: string;
	updatedAt: string;
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}

function Onboarding() {
	const navigate = useNavigate();
	const [cases, setCases] = useState<OnboardingCase[]>([]);
	const [loading, setLoading] = useState(true);
	const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
	const [pagination, setPagination] = useState<PaginationInfo>({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		itemsPerPage: 10
	});

	// Filters
	const [statusFilter, setStatusFilter] = useState('');
	const [priorityFilter, setPriorityFilter] = useState('');
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		fetchOnboardingCases();
	}, [pagination.currentPage, statusFilter, priorityFilter]);

	const fetchOnboardingCases = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: pagination.currentPage.toString(),
				limit: pagination.itemsPerPage.toString(),
				...(statusFilter && { status: statusFilter }),
				...(priorityFilter && { priority: priorityFilter })
			});

			const response = await onboardingApi.getAll(params);
			const data = await fetchJson(response);

			if (data.success) {
				setCases(data.data);
				setPagination(data.pagination);
			}
		} catch (error) {
			console.error('Error fetching onboarding cases:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		const colors = {
			'Not Started': 'default',
			'In Progress': 'primary',
			'On Hold': 'warning',
			Completed: 'success',
			Cancelled: 'error'
		};
		return colors[status as keyof typeof colors] || 'default';
	};

	const getPriorityColor = (priority: string) => {
		const colors = {
			Low: 'success',
			Medium: 'info',
			High: 'warning',
			Critical: 'error'
		};
		return colors[priority as keyof typeof colors] || 'default';
	};

	const handlePageChange = (event: unknown, newPage: number) => {
		setPagination((prev) => ({ ...prev, currentPage: newPage + 1 }));
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPagination((prev) => ({
			...prev,
			itemsPerPage: parseInt(event.target.value, 10),
			currentPage: 1
		}));
	};

	const handleNewCaseSuccess = () => {
		fetchOnboardingCases(); // Refresh the list
	};

	const handleViewCase = (caseId: string) => {
		navigate(`/onboarding/case/${caseId}`);
	};

	return (
		<>
			<div className="w-full">
				{/* Header */}
				{/* <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-8 sm:space-y-0 py-32 px-24 md:px-32">
					<div className="flex flex-col items-center sm:items-start space-y-8 sm:space-y-0 w-full sm:max-w-full min-w-0">
						<Typography
							component="h1"
							className="text-20 md:text-32 font-extrabold tracking-tight leading-none"
						>
							Onboarding Cases
						</Typography>
						<Typography
							component="h2"
							className="text-16 font-medium"
							color="text.secondary"
						>
							Manage client onboarding processes
						</Typography>
					</div>
					<Button
						variant="contained"
						color="primary"
						startIcon={<AddIcon />}
						className="whitespace-nowrap"
						onClick={() => setShowNewCaseDialog(true)}
					>
						New Case
					</Button>
				</div> */}

				{/* Content */}
				<div className="w-full p-5">
					{/* Filters */}
					<Box className="mb-10 flex flex-wrap gap-2">
						<TextField
							placeholder="Search cases..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="min-w-50"
							size="small"
						/>
						<FormControl
							className="min-w-50"
							size="small"
						>
							<InputLabel>Status</InputLabel>
							<Select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								label="Status"
							>
								<MenuItem value="">All</MenuItem>
								<MenuItem value="Not Started">Not Started</MenuItem>
								<MenuItem value="In Progress">In Progress</MenuItem>
								<MenuItem value="On Hold">On Hold</MenuItem>
								<MenuItem value="Completed">Completed</MenuItem>
								<MenuItem value="Cancelled">Cancelled</MenuItem>
							</Select>
						</FormControl>
						<FormControl
							className="min-w-50"
							size="small"
						>
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
						<Button
							variant="contained"
							color="primary"
							startIcon={<AddIcon />}
							size="small"
							onClick={() => setShowNewCaseDialog(true)}
						>
							New Case
						</Button>
					</Box>

					{/* Cases Table */}
					<div className="w-full">
						<TableContainer>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Case ID</TableCell>
										<TableCell>Workflow Type</TableCell>
										<TableCell>Client</TableCell>
										<TableCell>Status</TableCell>
										<TableCell>Priority</TableCell>
										<TableCell>Progress</TableCell>
										<TableCell>Champion</TableCell>
										<TableCell>Start Date</TableCell>
										<TableCell>Expected Completion</TableCell>
										<TableCell>Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell
												colSpan={9}
												align="center"
											>
												<CircularProgress />
											</TableCell>
										</TableRow>
									) : cases.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={9}
												align="center"
											>
												<Typography color="text.secondary">
													No onboarding cases found
												</Typography>
											</TableCell>
										</TableRow>
									) : (
										cases.map((onboardingCase) => (
											<TableRow
												key={onboardingCase._id}
												hover
											>
												<TableCell>
													<Typography
														variant="body2"
														className="font-medium"
													>
														{onboardingCase.caseId}
													</Typography>
												</TableCell>
												<TableCell>
													<div>
														<Typography
															variant="body2"
															className="font-medium"
														>
															{onboardingCase.workflowTypeId?.name || 'Onboarding'}
														</Typography>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															{onboardingCase.workflowTypeId?.prefix || 'OB'}
														</Typography>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<Typography
															variant="body2"
															className="font-medium"
														>
															{onboardingCase.clientId?.name || 'No Client Assigned'}
														</Typography>
														<Typography
															variant="caption"
															color="text.secondary"
														>
															{onboardingCase.clientId?.email || 'N/A'}
														</Typography>
													</div>
												</TableCell>
												<TableCell>
													<Chip
														label={onboardingCase.status}
														color={getStatusColor(onboardingCase.status) as any}
														size="small"
													/>
												</TableCell>
												<TableCell>
													<Chip
														label={onboardingCase.priority}
														color={getPriorityColor(onboardingCase.priority) as any}
														size="small"
													/>
												</TableCell>
												<TableCell>
													<Box className="flex items-center gap-8">
														<Box className="w-40 h-4 bg-gray-200 rounded-full overflow-hidden">
															<Box
																className="h-full bg-blue-500"
																style={{ width: `${onboardingCase.progress}%` }}
															/>
														</Box>
														<Typography variant="caption">
															{onboardingCase.progress}%
														</Typography>
													</Box>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{onboardingCase.assignedChampion.firstName}{' '}
														{onboardingCase.assignedChampion.lastName}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{new Date(onboardingCase.startDate).toLocaleDateString()}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{onboardingCase.expectedCompletionDate
															? new Date(
																	onboardingCase.expectedCompletionDate
																).toLocaleDateString()
															: 'Not set'}
													</Typography>
												</TableCell>
												<TableCell>
													<IconButton
														size="small"
														onClick={() => handleViewCase(onboardingCase._id)}
														color="primary"
														title="View Case Details"
													>
														<ViewIcon />
													</IconButton>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={pagination.totalItems}
							page={pagination.currentPage - 1}
							onPageChange={handlePageChange}
							rowsPerPage={pagination.itemsPerPage}
							onRowsPerPageChange={handleRowsPerPageChange}
							rowsPerPageOptions={[5, 10, 25, 50]}
						/>
					</div>
				</div>
			</div>

			{/* New Case Dialog */}
			<NewCaseDialog
				open={showNewCaseDialog}
				onClose={() => setShowNewCaseDialog(false)}
				onSuccess={handleNewCaseSuccess}
			/>
		</>
	);
}

export default Onboarding;
