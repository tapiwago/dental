import React, { useState, useEffect } from 'react';
import {
	Typography,
	Paper,
	Box,
	Chip,
	Divider,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemText,
	Button,
	CircularProgress,
	Alert,
	ButtonGroup
} from '@mui/material';
import { 
	ArrowBack as ArrowBackIcon,
	Add as AddIcon,
	FileDownload as ImportIcon
} from '@mui/icons-material';
import { useParams } from 'react-router';
import useNavigate from '@fuse/hooks/useNavigate';
import { onboardingApi, fetchJson } from '@/utils/authFetch';
import ImportTemplateDialog from './ImportTemplateDialog';
import AddStageDialog from './AddStageDialog';
import AddTaskDialog from './AddTaskDialog';

interface CaseDetails {
	_id: string;
	caseId: string;
	clientId: {
		_id: string;
		name: string;
		email: string;
		contactInfo?: {
			phone?: string;
			address?: {
				street?: string;
				city?: string;
				state?: string;
				zipCode?: string;
				country?: string;
			};
		};
	};
	status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	progress: number;
	startDate: string;
	expectedCompletionDate?: string;
	actualCompletionDate?: string;
	assignedChampion: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
		role?: string;
	};
	linkedGuides?: Array<{
		_id: string;
		title: string;
		description?: string;
		category?: string;
	}>;
	notes?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
	stages?: Array<{
		_id: string;
		name: string;
		description?: string;
		status: string;
		sequence: number;
		championId?: {
			_id: string;
			firstName: string;
			lastName: string;
			email: string;
		};
	}>;
	tasks?: Array<{
		_id: string;
		title: string;
		description?: string;
		status: string;
		priority: string;
		dueDate?: string;
		assignedTo?: {
			_id: string;
			firstName: string;
			lastName: string;
		};
	}>;
	documents?: Array<{
		_id: string;
		filename: string;
		originalName: string;
		mimeType: string;
		size: number;
		uploadedBy: {
			_id: string;
			firstName: string;
			lastName: string;
		};
		uploadedAt: string;
	}>;
}

function CaseDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	
	// Dialog states
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [addStageDialogOpen, setAddStageDialogOpen] = useState(false);
	const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
	const [importType, setImportType] = useState<'workflow' | 'stage' | 'task'>('workflow');

	useEffect(() => {
		if (id) {
			fetchCaseDetails();
		}
	}, [id]);

	const fetchCaseDetails = async () => {
		try {
			setLoading(true);
			setError('');
			const response = await onboardingApi.getById(id);
			const data = await fetchJson(response);

			if (data.success) {
				setCaseDetails(data.data);
			} else {
				setError(data.error || 'Failed to load case details');
			}
		} catch (error: any) {
			console.error('Error fetching case details:', error);
			setError('Failed to load case details. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		const colors = {
			'Not Started': 'default',
			'In Progress': 'primary',
			'On Hold': 'warning',
			'Completed': 'success',
			'Cancelled': 'error'
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

	const handleBack = () => {
		navigate('/onboarding');
	};

	const handleImportSuccess = () => {
		// Refresh case details after import
		fetchCaseDetails();
		setImportDialogOpen(false);
	};

	const handleOpenImportDialog = (type: 'workflow' | 'stage' | 'task') => {
		setImportType(type);
		setImportDialogOpen(true);
	};

	const handleStageCreated = () => {
		// Refresh case details after stage creation
		fetchCaseDetails();
		setAddStageDialogOpen(false);
	};

	const handleTaskCreated = () => {
		// Refresh case details after task creation
		fetchCaseDetails();
		setAddTaskDialogOpen(false);
	};

	if (loading) {
		return (
			<Box className="flex justify-center items-center min-h-400">
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box className="p-24">
				<Alert severity="error" className="mb-16">
					{error}
				</Alert>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={handleBack}
				>
					Back to Onboarding
				</Button>
			</Box>
		);
	}

	if (!caseDetails) {
		return (
			<Box className="p-24">
				<Alert severity="warning" className="mb-16">
					Case not found
				</Alert>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={handleBack}
				>
					Back to Onboarding
				</Button>
			</Box>
		);
	}

	return (
		<div className="w-full p-5">
			{/* Header */}
			<Box className="mb-16">
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={handleBack}
					className="mb-12"
				>
					Back to Onboarding
				</Button>
				
				<Box className="flex items-center justify-between">
					<div>
						<Typography variant="h5" className="font-bold">
							Case Details: {caseDetails.caseId}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Client: {caseDetails.clientId.name}
						</Typography>
					</div>
					<Box className="flex gap-8">
						<Chip
							label={caseDetails.status}
							color={getStatusColor(caseDetails.status) as any}
							size="small"
						/>
						<Chip
							label={caseDetails.priority}
							color={getPriorityColor(caseDetails.priority) as any}
							size="small"
						/>
					</Box>
				</Box>
			</Box>

			<Box className="grid grid-cols-1 md:grid-cols-2 gap-16">
				{/* Case Information */}
				<Card>
					<CardContent className="p-5">
						<Typography variant="h6" className="mb-12">
							Case Information
						</Typography>
						<Box className="space-y-8">
							<Box>
								<Typography variant="body2" color="text.secondary">
									Case ID
								</Typography>
								<Typography variant="body1">
									{caseDetails.caseId}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Progress
								</Typography>
								<Box className="flex items-center gap-8 mt-2">
									<Box className="w-150 h-6 bg-gray-200 rounded-full overflow-hidden">
										<Box
											className="h-full bg-blue-500"
											style={{ width: `${caseDetails.progress}%` }}
										/>
									</Box>
									<Typography variant="body2">
										{caseDetails.progress}%
									</Typography>
								</Box>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Start Date
								</Typography>
								<Typography variant="body1">
									{new Date(caseDetails.startDate).toLocaleDateString()}
								</Typography>
							</Box>
							{caseDetails.expectedCompletionDate && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Expected Completion
									</Typography>
									<Typography variant="body1">
										{new Date(caseDetails.expectedCompletionDate).toLocaleDateString()}
									</Typography>
								</Box>
							)}
							{caseDetails.actualCompletionDate && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Actual Completion
									</Typography>
									<Typography variant="body1">
										{new Date(caseDetails.actualCompletionDate).toLocaleDateString()}
									</Typography>
								</Box>
							)}
							<Box>
								<Typography variant="body2" color="text.secondary">
									Assigned Champion
								</Typography>
								<Typography variant="body1">
									{caseDetails.assignedChampion.firstName} {caseDetails.assignedChampion.lastName}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{caseDetails.assignedChampion.email}
								</Typography>
							</Box>
							{caseDetails.notes && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Notes
									</Typography>
									<Typography variant="body1">
										{caseDetails.notes}
									</Typography>
								</Box>
							)}
							{caseDetails.tags && caseDetails.tags.length > 0 && (
								<Box>
									<Typography variant="body2" color="text.secondary" className="mb-6">
										Tags
									</Typography>
									<Box className="flex flex-wrap gap-4">
										{caseDetails.tags.map((tag, index) => (
											<Chip key={index} label={tag} size="small" variant="outlined" />
										))}
									</Box>
								</Box>
							)}
						</Box>
					</CardContent>
				</Card>

				{/* Client Information */}
				<Card>
					<CardContent className="p-5">
						<Typography variant="h6" className="mb-12">
							Client Information
						</Typography>
						<Box className="space-y-8">
							<Box>
								<Typography variant="body2" color="text.secondary">
									Name
								</Typography>
								<Typography variant="body1">
									{caseDetails.clientId.name}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Email
								</Typography>
								<Typography variant="body1">
									{caseDetails.clientId.email}
								</Typography>
							</Box>
							{caseDetails.clientId.contactInfo?.phone && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Phone
									</Typography>
									<Typography variant="body1">
										{caseDetails.clientId.contactInfo.phone}
									</Typography>
								</Box>
							)}
							{caseDetails.clientId.contactInfo?.address && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Address
									</Typography>
									<Typography variant="body1">
										{[
											caseDetails.clientId.contactInfo.address.street,
											caseDetails.clientId.contactInfo.address.city,
											caseDetails.clientId.contactInfo.address.state,
											caseDetails.clientId.contactInfo.address.zipCode,
											caseDetails.clientId.contactInfo.address.country
										].filter(Boolean).join(', ')}
									</Typography>
								</Box>
							)}
						</Box>
					</CardContent>
				</Card>
			</Box>

			{/* Additional sections */}
			<Box className="space-y-16 mt-16">
				{/* Linked Guides */}
				{caseDetails.linkedGuides && caseDetails.linkedGuides.length > 0 && (
					<Card>
						<CardContent className="p-5">
							<Typography variant="h6" className="mb-12">
								Linked Guides
							</Typography>
							<List dense>
								{caseDetails.linkedGuides.map((guide) => (
									<ListItem key={guide._id} divider>
										<ListItemText
											primary={guide.title}
											secondary={guide.description}
										/>
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				)}

				{/* Stages */}
				{caseDetails.stages && caseDetails.stages.length > 0 ? (
					<Card>
						<CardContent className="p-5">
							<Box className="flex items-center justify-between mb-12">
								<Typography variant="h6">
									Stages
								</Typography>
								<ButtonGroup size="small">
									<Button
										startIcon={<ImportIcon />}
										onClick={() => handleOpenImportDialog('workflow')}
									>
										Import from Template
									</Button>
									<Button
										startIcon={<AddIcon />}
										onClick={() => setAddStageDialogOpen(true)}
									>
										Add Stage
									</Button>
									<Button
										startIcon={<AddIcon />}
										onClick={() => setAddTaskDialogOpen(true)}
									>
										Add Task
									</Button>
								</ButtonGroup>
							</Box>
							<List dense>
								{caseDetails.stages.map((stage) => (
									<ListItem key={stage._id} divider>
										<ListItemText
											primary={`${stage.sequence}. ${stage.name}`}
											secondary={
												<Box>
													{stage.description && (
														<Typography variant="body2">
															{stage.description}
														</Typography>
													)}
													<Box className="flex gap-8 mt-2">
														<Chip
															label={stage.status}
															size="small"
														/>
													</Box>
													{stage.championId && (
														<Typography variant="caption" color="text.secondary" className="mt-2">
															Champion: {stage.championId.firstName} {stage.championId.lastName}
														</Typography>
													)}
												</Box>
											}
										/>
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="p-5">
							<Box className="flex items-center justify-between mb-12">
								<Typography variant="h6">
									Stages
								</Typography>
								<ButtonGroup size="small">
									<Button
										startIcon={<ImportIcon />}
										onClick={() => handleOpenImportDialog('workflow')}
									>
										Import from Template
									</Button>
									<Button
										startIcon={<AddIcon />}
										onClick={() => setAddStageDialogOpen(true)}
									>
										Add Stage
									</Button>
									<Button
										startIcon={<AddIcon />}
										onClick={() => setAddTaskDialogOpen(true)}
									>
										Add Task
									</Button>
								</ButtonGroup>
							</Box>
							<Typography variant="body2" color="text.secondary" className="text-center py-16">
								No stages found. Import from a template or create manually.
							</Typography>
						</CardContent>
					</Card>
				)}

				{/* Tasks */}
				{caseDetails.tasks && caseDetails.tasks.length > 0 ? (
					<Card>
						<CardContent className="p-5">
							<Box className="flex items-center justify-between mb-12">
								<Typography variant="h6">
									Tasks
								</Typography>
								<Button
									size="small"
									startIcon={<AddIcon />}
									onClick={() => setAddTaskDialogOpen(true)}
								>
									Add Task
								</Button>
							</Box>
							<List dense>
								{caseDetails.tasks.map((task) => (
									<ListItem key={task._id} divider>
										<ListItemText
											primary={task.title}
											secondary={
												<Box>
													{task.description && (
														<Typography variant="body2">
															{task.description}
														</Typography>
													)}
													<Box className="flex gap-8 mt-2">
														<Chip
															label={task.status}
															size="small"
														/>
														<Chip
															label={task.priority}
															size="small"
															color={getPriorityColor(task.priority) as any}
														/>
														{task.dueDate && (
															<Chip
																label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
																size="small"
																variant="outlined"
															/>
														)}
													</Box>
													{task.assignedTo && (
														<Typography variant="caption" color="text.secondary" className="mt-2">
															Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
														</Typography>
													)}
												</Box>
											}
										/>
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="p-5">
							<Box className="flex items-center justify-between mb-12">
								<Typography variant="h6">
									Tasks
								</Typography>
								<Button
									size="small"
									startIcon={<AddIcon />}
									onClick={() => setAddTaskDialogOpen(true)}
								>
									Add Task
								</Button>
							</Box>
							<Typography variant="body2" color="text.secondary" className="text-center py-16">
								No tasks found. Create tasks manually or import stages with tasks from templates.
							</Typography>
						</CardContent>
					</Card>
				)}

				{/* Documents */}
				{caseDetails.documents && caseDetails.documents.length > 0 && (
					<Card>
						<CardContent className="p-5">
							<Typography variant="h6" className="mb-12">
								Documents
							</Typography>
							<List dense>
								{caseDetails.documents.map((document) => (
									<ListItem key={document._id} divider>
										<ListItemText
											primary={document.originalName}
											secondary={
												<Box>
													<Typography variant="body2">
														Size: {(document.size / 1024).toFixed(2)} KB
													</Typography>
													<Typography variant="caption" color="text.secondary">
														Uploaded by: {document.uploadedBy.firstName} {document.uploadedBy.lastName} on {new Date(document.uploadedAt).toLocaleDateString()}
													</Typography>
												</Box>
											}
										/>
									</ListItem>
								))}
							</List>
						</CardContent>
					</Card>
				)}
			</Box>

			{/* Import Template Dialog */}
			<ImportTemplateDialog
				open={importDialogOpen}
				onClose={() => setImportDialogOpen(false)}
				onSuccess={handleImportSuccess}
				caseId={caseDetails._id}
				importType={importType}
			/>

			{/* Add Stage Dialog */}
			<AddStageDialog
				open={addStageDialogOpen}
				onClose={() => setAddStageDialogOpen(false)}
				onSuccess={handleStageCreated}
				caseId={caseDetails._id}
			/>

			{/* Add Task Dialog */}
			<AddTaskDialog
				open={addTaskDialogOpen}
				onClose={() => setAddTaskDialogOpen(false)}
				onSuccess={handleTaskCreated}
				caseId={caseDetails._id}
			/>
		</div>
	);
}

export default CaseDetails;
