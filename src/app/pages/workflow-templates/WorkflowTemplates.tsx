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
	IconButton,
	Tooltip
} from '@mui/material';
import {
	Add as AddIcon,
	Visibility as ViewIcon,
	Edit as EditIcon,
	ContentCopy as CloneIcon,
	Publish as PublishIcon,
	Delete as DeleteIcon,
	Star as StarIcon,
	StarBorder as StarBorderIcon
} from '@mui/icons-material';
import useNavigate from '@fuse/hooks/useNavigate';
import { templateApi, fetchJson } from '@/utils/authFetch';

// Lazy import to avoid circular dependencies
const NewTemplateDialog = React.lazy(() => import('./NewTemplateDialog'));

interface Template {
	_id: string;
	templateId: string;
	name: string;
	description?: string;
	type: 'OnboardingCase' | 'Stage' | 'Task' | 'WorkflowGuide';
	industryType: 'Dental' | 'Medical' | 'Veterinary' | 'General';
	clientSize: 'Small' | 'Medium' | 'Large' | 'Enterprise';
	complexity: 'Simple' | 'Standard' | 'Complex' | 'Enterprise';
	status: 'Draft' | 'Published' | 'Deprecated' | 'Archived';
	version: string;
	isDefault: boolean;
	usageCount: number;
	successRate: number;
	averageCompletionTime?: number;
	estimatedDuration?: number;
	estimatedCost?: number;
	tags: string[];
	categories: string[];
	createdBy: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	lastModifiedBy?: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	approvedBy?: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	approvalDate?: string;
	createdAt: string;
	updatedAt: string;
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	total: number;
}

function WorkflowTemplates() {
	const navigate = useNavigate();
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
	const [pagination, setPagination] = useState<PaginationInfo>({
		currentPage: 1,
		totalPages: 1,
		total: 0
	});
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Filters
	const [typeFilter, setTypeFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [industryFilter, setIndustryFilter] = useState('');
	const [complexityFilter, setComplexityFilter] = useState('');
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		fetchTemplates();
	}, [pagination.currentPage, rowsPerPage, typeFilter, statusFilter, industryFilter, complexityFilter]);

	const fetchTemplates = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: pagination.currentPage.toString(),
				limit: rowsPerPage.toString(),
				...(typeFilter && { type: typeFilter }),
				...(statusFilter && { status: statusFilter }),
				...(industryFilter && { industryType: industryFilter }),
				...(complexityFilter && { complexity: complexityFilter }),
				...(searchTerm && { search: searchTerm })
			});

			const response = await templateApi.getAll(params);
			const data = await fetchJson(response);

			if (data.templates) {
				setTemplates(data.templates);
				setPagination({
					currentPage: data.pagination?.currentPage || 1,
					totalPages: data.pagination?.totalPages || 1,
					total: data.pagination?.total || 0
				});
			} else if (Array.isArray(data)) {
				// Handle case where data is directly an array
				setTemplates(data);
				setPagination({
					currentPage: 1,
					totalPages: 1,
					total: data.length
				});
			}
		} catch (error) {
			console.error('Error fetching templates:', error);
			setTemplates([]);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		const colors = {
			Draft: 'default',
			Published: 'success',
			Deprecated: 'warning',
			Archived: 'error'
		};
		return colors[status as keyof typeof colors] || 'default';
	};

	const getComplexityColor = (complexity: string) => {
		const colors = {
			Simple: 'success',
			Standard: 'info',
			Complex: 'warning',
			Enterprise: 'error'
		};
		return colors[complexity as keyof typeof colors] || 'default';
	};

	const getTypeColor = (type: string) => {
		const colors = {
			OnboardingCase: 'primary',
			Stage: 'secondary',
			Task: 'info',
			WorkflowGuide: 'success'
		};
		return colors[type as keyof typeof colors] || 'default';
	};

	const handlePageChange = (event: unknown, newPage: number) => {
		setPagination((prev) => ({ ...prev, currentPage: newPage + 1 }));
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPagination((prev) => ({ ...prev, currentPage: 1 }));
	};

	const handleViewTemplate = (templateId: string) => {
		navigate(`/workflow-templates/template/${templateId}`);
	};

	const handleEditTemplate = (templateId: string) => {
		navigate(`/workflow-templates/template/${templateId}/edit`);
	};

	const handleCloneTemplate = async (templateId: string) => {
		try {
			const response = await templateApi.clone(templateId, {
				name: `Cloned Template ${Date.now()}`,
				description: 'Cloned template'
			});
			const data = await fetchJson(response);

			if (data._id) {
				await fetchTemplates(); // Refresh the list
			}
		} catch (error) {
			console.error('Error cloning template:', error);
		}
	};

	const handlePublishTemplate = async (templateId: string) => {
		try {
			await templateApi.publish(templateId);
			await fetchTemplates(); // Refresh the list
		} catch (error) {
			console.error('Error publishing template:', error);
		}
	};

	const handleDeleteTemplate = async (templateId: string) => {
		if (window.confirm('Are you sure you want to delete this template?')) {
			try {
				await templateApi.delete(templateId);
				await fetchTemplates(); // Refresh the list
			} catch (error) {
				console.error('Error deleting template:', error);
			}
		}
	};

	const handleNewTemplateSuccess = () => {
		fetchTemplates(); // Refresh the list
	};

	return (
		<div className="w-full">
			{/* Content */}
			<div className="w-full p-5">
				{/* Filters */}
				<Box className="mb-10 flex flex-wrap gap-2">
					<TextField
						placeholder="Search templates..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="min-w-50"
						size="small"
					/>
					<FormControl
						className="min-w-50"
						size="small"
					>
						<InputLabel>Type</InputLabel>
						<Select
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value)}
							label="Type"
						>
							<MenuItem value="">All</MenuItem>
							<MenuItem value="OnboardingCase">Onboarding Case</MenuItem>
							<MenuItem value="Stage">Stage</MenuItem>
							<MenuItem value="Task">Task</MenuItem>
							<MenuItem value="WorkflowGuide">Workflow Guide</MenuItem>
						</Select>
					</FormControl>
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
							<MenuItem value="Draft">Draft</MenuItem>
							<MenuItem value="Published">Published</MenuItem>
							<MenuItem value="Deprecated">Deprecated</MenuItem>
							<MenuItem value="Archived">Archived</MenuItem>
						</Select>
					</FormControl>
					<FormControl
						className="min-w-50"
						size="small"
					>
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
							<MenuItem value="General">General</MenuItem>
						</Select>
					</FormControl>
					<FormControl
						className="min-w-50"
						size="small"
					>
						<InputLabel>Complexity</InputLabel>
						<Select
							value={complexityFilter}
							onChange={(e) => setComplexityFilter(e.target.value)}
							label="Complexity"
						>
							<MenuItem value="">All</MenuItem>
							<MenuItem value="Simple">Simple</MenuItem>
							<MenuItem value="Standard">Standard</MenuItem>
							<MenuItem value="Complex">Complex</MenuItem>
							<MenuItem value="Enterprise">Enterprise</MenuItem>
						</Select>
					</FormControl>
					<Button
						variant="contained"
						color="primary"
						startIcon={<AddIcon />}
						size="small"
						onClick={() => {
							console.log('Create template button clicked');
							setShowNewTemplateDialog(true);
						}}
					>
						New Template
					</Button>
				</Box>

				{/* Templates Table */}
				<div className="w-full">
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Type</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Industry</TableCell>
									<TableCell>Complexity</TableCell>
									<TableCell>Usage</TableCell>
									<TableCell>Success Rate</TableCell>
									<TableCell>Version</TableCell>
									<TableCell>Default</TableCell>
									<TableCell>Created By</TableCell>
									<TableCell>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell
											colSpan={11}
											align="center"
										>
											<CircularProgress />
										</TableCell>
									</TableRow>
								) : templates.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={11}
											align="center"
										>
											<Typography color="text.secondary">No templates found</Typography>
										</TableCell>
									</TableRow>
								) : (
									templates.map((template) => (
										<TableRow
											key={template._id}
											hover
										>
											<TableCell>
												<div>
													<Typography
														variant="body2"
														className="font-medium"
													>
														{template.name}
													</Typography>
													{template.description && (
														<Typography
															variant="caption"
															color="text.secondary"
														>
															{template.description}
														</Typography>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Chip
													label={template.type}
													color={getTypeColor(template.type) as any}
													size="small"
												/>
											</TableCell>
											<TableCell>
												<Chip
													label={template.status}
													color={getStatusColor(template.status) as any}
													size="small"
												/>
											</TableCell>
											<TableCell>
												<Typography variant="body2">{template.industryType}</Typography>
											</TableCell>
											<TableCell>
												<Chip
													label={template.complexity}
													color={getComplexityColor(template.complexity) as any}
													size="small"
												/>
											</TableCell>
											<TableCell>
												<Typography variant="body2">{template.usageCount}</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2">{template.successRate}%</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2">{template.version}</Typography>
											</TableCell>
											<TableCell>
												{template.isDefault ? (
													<StarIcon
														color="primary"
														fontSize="small"
													/>
												) : (
													<StarBorderIcon
														color="disabled"
														fontSize="small"
													/>
												)}
											</TableCell>
											<TableCell>
												<Typography variant="body2">
													{template.createdBy?.firstName} {template.createdBy?.lastName}
												</Typography>
											</TableCell>
											<TableCell>
												<Box className="flex gap-1">
													<Tooltip title="View Details">
														<IconButton
															size="small"
															onClick={() => handleViewTemplate(template._id)}
															color="primary"
														>
															<ViewIcon />
														</IconButton>
													</Tooltip>
													<Tooltip title="Edit Template">
														<IconButton
															size="small"
															onClick={() => handleEditTemplate(template._id)}
															color="secondary"
														>
															<EditIcon />
														</IconButton>
													</Tooltip>
													<Tooltip title="Clone Template">
														<IconButton
															size="small"
															onClick={() => handleCloneTemplate(template._id)}
															color="info"
														>
															<CloneIcon />
														</IconButton>
													</Tooltip>
													{template.status === 'Draft' && (
														<Tooltip title="Publish Template">
															<IconButton
																size="small"
																onClick={() => handlePublishTemplate(template._id)}
																color="success"
															>
																<PublishIcon />
															</IconButton>
														</Tooltip>
													)}
													<Tooltip title="Delete Template">
														<IconButton
															size="small"
															onClick={() => handleDeleteTemplate(template._id)}
															color="error"
														>
															<DeleteIcon />
														</IconButton>
													</Tooltip>
												</Box>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
					<TablePagination
						component="div"
						count={pagination.total}
						page={pagination.currentPage - 1}
						onPageChange={handlePageChange}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={handleRowsPerPageChange}
						rowsPerPageOptions={[5, 10, 25, 50]}
					/>
				</div>
			</div>

			{/* New Template Dialog */}
			<NewTemplateDialog
				open={showNewTemplateDialog}
				onClose={() => {
					console.log('Closing template dialog');
					setShowNewTemplateDialog(false);
				}}
				onSuccess={handleNewTemplateSuccess}
			/>
		</div>
	);
}

export default WorkflowTemplates;
