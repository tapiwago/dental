import { useState, useEffect } from 'react';
import {
	Typography,
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
	ButtonGroup,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	DialogContentText
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Add as AddIcon,
	FileDownload as ImportIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import { useParams } from 'react-router';
import useNavigate from '@fuse/hooks/useNavigate';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';
import { useAppDispatch } from 'src/store/hooks';
import { onboardingApi, stageApi, taskApi, fetchJson } from '@/utils/authFetch';
import ImportTemplateDialog from './ImportTemplateDialogNew';
import AddStageDialog from './AddStageDialog';
import AddTaskDialog from './AddTaskDialog';
import AddTasksToStageDialog from './AddTasksToStageDialog';

interface CaseDetails {
	_id: string;
	caseId: string;
	clientId?: {
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
	status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled' | 'Planning';
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
	linkedGuides?: {
		_id: string;
		title: string;
		description?: string;
		category?: string;
	}[];
	notes?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
	stages?: {
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
	}[];
	tasks?: {
		_id: string;
		title: string;
		name?: string; // Alternative field name from backend
		description?: string;
		status: string;
		priority: string;
		dueDate?: string;
		stageId?: string; // Link to stage
		assignedTo?: {
			_id: string;
			firstName: string;
			lastName: string;
		};
	}[];
	documents?: {
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
	}[];
}

function CaseDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Dialog states
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [addStageDialogOpen, setAddStageDialogOpen] = useState(false);
	const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
	const [addTasksToStageDialogOpen, setAddTasksToStageDialogOpen] = useState(false);
	const [selectedStageId, setSelectedStageId] = useState<string>('');
	const [selectedStageName, setSelectedStageName] = useState<string>('');
	const [importType, setImportType] = useState<'workflow' | 'stage' | 'task'>('workflow');

	// Confirmation dialog states
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [confirmDialogData, setConfirmDialogData] = useState<{
		title: string;
		message: string;
		onConfirm: () => void;
		confirmText?: string;
		cancelText?: string;
	} | null>(null);

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
			Planning: 'info',
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

	const handleOpenAddTasksToStage = (stageId: string, stageName: string) => {
		setSelectedStageId(stageId);
		setSelectedStageName(stageName);
		setAddTasksToStageDialogOpen(true);
	};

	// Helper function to group tasks by stage
	const getTasksForStage = (stageId: string) => {
		if (!caseDetails?.tasks) return [];

		return caseDetails.tasks.filter((task) => task.stageId === stageId);
	};

	// Helper function to get unassigned tasks (tasks without a stage or with invalid stageId)
	const getUnassignedTasks = () => {
		if (!caseDetails?.tasks || !caseDetails?.stages) return caseDetails?.tasks || [];

		const stageIds = caseDetails.stages.map((stage) => stage._id);
		return caseDetails.tasks.filter((task) => !task.stageId || !stageIds.includes(task.stageId));
	};

	const handleTasksAddedToStage = () => {
		// Refresh case details after tasks are added to stage
		fetchCaseDetails();
		setAddTasksToStageDialogOpen(false);
	};

	// Helper function to show confirmation dialog
	const showConfirmDialog = (
		title: string,
		message: string,
		onConfirm: () => void,
		confirmText = 'Delete',
		cancelText = 'Cancel'
	) => {
		setConfirmDialogData({
			title,
			message,
			onConfirm,
			confirmText,
			cancelText
		});
		setConfirmDialogOpen(true);
	};

	const handleConfirmDialogClose = () => {
		setConfirmDialogOpen(false);
		setConfirmDialogData(null);
	};

	const handleConfirmDialogConfirm = () => {
		if (confirmDialogData?.onConfirm) {
			confirmDialogData.onConfirm();
		}

		handleConfirmDialogClose();
	};

	const handleDeleteStage = async (stageId: string, stageName: string) => {
		const deleteStage = async () => {
			try {
				const response = await stageApi.delete(stageId);
				const data = await fetchJson(response);

				if (data.success) {
					// Refresh case details to show updated data
					fetchCaseDetails();
					dispatch(
						showMessage({
							message: `Stage "${stageName}" deleted successfully`,
							variant: 'success'
						})
					);
				} else {
					dispatch(
						showMessage({
							message: `Failed to delete stage: ${data.error || 'Unknown error'}`,
							variant: 'error'
						})
					);
				}
			} catch (error: any) {
				console.error('Error deleting stage:', error);
				dispatch(
					showMessage({
						message: 'Failed to delete stage. Please try again.',
						variant: 'error'
					})
				);
			}
		};

		showConfirmDialog(
			'Delete Stage',
			`Are you sure you want to delete the stage "${stageName}"? This action cannot be undone.`,
			deleteStage
		);
	};

	const handleDeleteTask = async (taskId: string, taskName: string) => {
		const deleteTask = async () => {
			try {
				const response = await taskApi.delete(taskId);
				const data = await fetchJson(response);

				if (data.success) {
					// Refresh case details to show updated data
					fetchCaseDetails();
					dispatch(
						showMessage({
							message: `Task "${taskName}" deleted successfully`,
							variant: 'success'
						})
					);
				} else {
					dispatch(
						showMessage({
							message: `Failed to delete task: ${data.error || 'Unknown error'}`,
							variant: 'error'
						})
					);
				}
			} catch (error: any) {
				console.error('Error deleting task:', error);
				dispatch(
					showMessage({
						message: 'Failed to delete task. Please try again.',
						variant: 'error'
					})
				);
			}
		};

		showConfirmDialog(
			'Delete Task',
			`Are you sure you want to delete the task "${taskName}"? This action cannot be undone.`,
			deleteTask
		);
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
				<Alert
					severity="error"
					className="mb-16"
				>
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
				<Alert
					severity="warning"
					className="mb-16"
				>
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
			<Box className="mb-5">
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
						<Typography
							variant="h5"
							className="font-bold"
						>
							Case Details: {caseDetails.caseId}
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							Client: {caseDetails.clientId?.name || 'No Client Assigned'}
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

			{/* Modern Case & Client Overview */}
			<Box className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
				{/* Case Summary Card */}
				<Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
					<CardContent className="p-6">
						<Box className="flex items-center mb-4">
							<Box className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
								<Typography
									variant="h6"
									className="text-white font-bold"
								>
									📋
								</Typography>
							</Box>
							<Typography
								variant="h6"
								className="font-bold text-blue-800"
							>
								Case Overview
							</Typography>
						</Box>

						<Box className="space-y-3">
							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Typography
									variant="caption"
									className="text-blue-600 font-medium block"
								>
									Case ID
								</Typography>
								<Typography
									variant="body1"
									className="font-bold text-gray-800"
								>
									{caseDetails.caseId}
								</Typography>
							</Box>

							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Typography
									variant="caption"
									className="text-blue-600 font-medium block"
								>
									Timeline
								</Typography>
								<Typography
									variant="body2"
									className="text-gray-700"
								>
									Started: {new Date(caseDetails.startDate).toLocaleDateString()}
								</Typography>
								{caseDetails.expectedCompletionDate && (
									<Typography
										variant="body2"
										className="text-gray-700"
									>
										Due: {new Date(caseDetails.expectedCompletionDate).toLocaleDateString()}
									</Typography>
								)}
							</Box>

							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Box className="flex items-center justify-between mb-2">
									<Typography
										variant="caption"
										className="text-blue-600 font-medium"
									>
										Progress
									</Typography>
									<Typography
										variant="caption"
										className="font-bold text-blue-700"
									>
										{caseDetails.progress}%
									</Typography>
								</Box>
								<Box className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
									<Box
										className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
										style={{ width: `${caseDetails.progress}%` }}
									/>
								</Box>
							</Box>
						</Box>
					</CardContent>
				</Card>

				{/* Client Info Card */}
				<Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
					<CardContent className="p-6">
						<Box className="flex items-center mb-4">
							<Box className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
								<Typography
									variant="h6"
									className="text-white font-bold"
								>
									👤
								</Typography>
							</Box>
							<Typography
								variant="h6"
								className="font-bold text-green-800"
							>
								Client Details
							</Typography>
						</Box>

						<Box className="space-y-3">
							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Typography
									variant="caption"
									className="text-green-600 font-medium block"
								>
									Client Name
								</Typography>
								<Typography
									variant="body1"
									className="font-bold text-gray-800"
								>
									{caseDetails.clientId?.name || 'No Client Assigned'}
								</Typography>
							</Box>

							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Typography
									variant="caption"
									className="text-green-600 font-medium block"
								>
									Contact Information
								</Typography>
								<Typography
									variant="body2"
									className="text-gray-700 break-words"
								>
									{caseDetails.clientId?.email || 'N/A'}
								</Typography>
								{caseDetails.clientId?.contactInfo?.phone && (
									<Typography
										variant="body2"
										className="text-gray-700"
									>
										📞 {caseDetails.clientId.contactInfo.phone}
									</Typography>
								)}
								{caseDetails.clientId?.contactInfo?.address && (
									<Typography
										variant="body2"
										className="text-gray-700"
									>
										📍{' '}
										{[
											caseDetails.clientId?.contactInfo?.address?.city,
											caseDetails.clientId?.contactInfo?.address?.state,
											caseDetails.clientId?.contactInfo?.address?.country
										]
											.filter(Boolean)
											.join(', ')}
									</Typography>
								)}
							</Box>
						</Box>
					</CardContent>
				</Card>

				{/* Assignment & Status Card */}
				<Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
					<CardContent className="p-6">
						<Box className="flex items-center mb-4">
							<Box className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
								<Typography
									variant="h6"
									className="text-white font-bold"
								>
									🏆
								</Typography>
							</Box>
							<Typography
								variant="h6"
								className="font-bold text-purple-800"
							>
								Assignment & Status
							</Typography>
						</Box>

						<Box className="space-y-3">
							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Typography
									variant="caption"
									className="text-purple-600 font-medium block"
								>
									Assigned Champion
								</Typography>
								<Typography
									variant="body1"
									className="font-bold text-gray-800"
								>
									{caseDetails.assignedChampion.firstName} {caseDetails.assignedChampion.lastName}
								</Typography>
								<Typography
									variant="caption"
									className="text-gray-600"
								>
									{caseDetails.assignedChampion.email}
								</Typography>
							</Box>

							<Box className="bg-white rounded-lg p-3 shadow-sm">
								<Typography
									variant="caption"
									className="text-purple-600 font-medium block mb-2"
								>
									Current Status
								</Typography>
								<Box className="flex flex-wrap gap-2">
									<Chip
										label={caseDetails.status}
										color={getStatusColor(caseDetails.status) as any}
										size="small"
										className="font-medium"
									/>
									<Chip
										label={caseDetails.priority}
										color={getPriorityColor(caseDetails.priority) as any}
										size="small"
										className="font-medium"
									/>
								</Box>
							</Box>

							{caseDetails.tags && caseDetails.tags.length > 0 && (
								<Box className="bg-white rounded-lg p-3 shadow-sm">
									<Typography
										variant="caption"
										className="text-purple-600 font-medium block mb-2"
									>
										Tags
									</Typography>
									<Box className="flex flex-wrap gap-1">
										{caseDetails.tags.slice(0, 3).map((tag, index) => (
											<Chip
												key={index}
												label={tag}
												size="small"
												variant="outlined"
												className="text-xs"
											/>
										))}
										{caseDetails.tags.length > 3 && (
											<Chip
												label={`+${caseDetails.tags.length - 3} more`}
												size="small"
												variant="outlined"
												className="text-xs"
											/>
										)}
									</Box>
								</Box>
							)}

							{caseDetails.notes && (
								<Box className="bg-white rounded-lg p-3 shadow-sm">
									<Typography
										variant="caption"
										className="text-purple-600 font-medium block mb-1"
									>
										Notes
									</Typography>
									<Typography
										variant="body2"
										className="text-gray-700 text-sm leading-relaxed"
									>
										{caseDetails.notes.length > 100
											? `${caseDetails.notes.substring(0, 100)}...`
											: caseDetails.notes}
									</Typography>
								</Box>
							)}

							{caseDetails.actualCompletionDate && (
								<Box className="bg-white rounded-lg p-3 shadow-sm">
									<Typography
										variant="caption"
										className="text-purple-600 font-medium block"
									>
										Completed Date
									</Typography>
									<Typography
										variant="body2"
										className="text-gray-700"
									>
										✅ {new Date(caseDetails.actualCompletionDate).toLocaleDateString()}
									</Typography>
								</Box>
							)}
						</Box>
					</CardContent>
				</Card>
			</Box>

			{/* Horizontal Divider */}
			<Divider className="my-24" />

			{/* Additional sections */}
			<Box className="space-y-16 mt-16">
				{/* Linked Guides */}
				{caseDetails.linkedGuides && caseDetails.linkedGuides.length > 0 && (
					<Card>
						<CardContent className="p-5">
							<Typography
								variant="h6"
								className="mb-12"
							>
								Linked Guides
							</Typography>
							<List dense>
								{caseDetails.linkedGuides.map((guide) => (
									<ListItem
										key={guide._id}
										divider
									>
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

				{/* Stages with Nested Tasks */}
				{caseDetails.stages && caseDetails.stages.length > 0 ? (
					<Card>
						<CardContent className="p-5">
							<Box className="flex items-center justify-between mb-12">
								<Typography variant="h6">Workflow Stages & Tasks</Typography>
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

							{/* Stages with nested tasks */}
							<Box className="space-y-16">
								{caseDetails.stages.map((stage) => {
									const stageTasks = getTasksForStage(stage._id);
									return (
										<Card
											key={stage._id}
											variant="outlined"
											className="border-l-4 border-l-blue-500"
										>
											<CardContent className="p-4">
												{/* Stage Header */}
												<Box className="flex items-center justify-between mb-3">
													<Box className="flex items-center gap-3">
														<Box className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
															{stage.sequence}
														</Box>
														<div>
															<Typography
																variant="h6"
																className="text-gray-800"
															>
																{stage.name}
															</Typography>
															{stage.description && (
																<Typography
																	variant="body2"
																	color="text.secondary"
																>
																	{stage.description}
																</Typography>
															)}
														</div>
													</Box>
													<Box className="flex items-center gap-2">
														<Chip
															label={stage.status}
															size="small"
															color={getStatusColor(stage.status) as any}
														/>
														<Button
															size="small"
															variant="outlined"
															startIcon={<AddIcon />}
															onClick={() =>
																handleOpenAddTasksToStage(stage._id, stage.name)
															}
														>
															Add Tasks
														</Button>
														<IconButton
															size="small"
															color="error"
															onClick={() => handleDeleteStage(stage._id, stage.name)}
															title={`Delete stage "${stage.name}"`}
														>
															<DeleteIcon />
														</IconButton>
													</Box>
												</Box>

												{stage.championId && (
													<Typography
														variant="caption"
														color="text.secondary"
														className="block mb-3"
													>
														Champion: {stage.championId.firstName}{' '}
														{stage.championId.lastName}
													</Typography>
												)}

												{/* Stage Tasks */}
												{stageTasks.length > 0 ? (
													<Box className="mt-4 bg-gray-50 rounded-lg p-3">
														<Typography
															variant="subtitle2"
															className="mb-3 text-gray-700"
														>
															Tasks ({stageTasks.length})
														</Typography>
														<Box className="space-y-2">
															{stageTasks.map((task) => (
																<Card
																	key={task._id}
																	className="bg-white shadow-sm"
																>
																	<CardContent className="p-3">
																		<Box className="flex items-start justify-between">
																			<Box className="flex-1">
																				<Typography
																					variant="subtitle2"
																					className="font-medium"
																				>
																					{task.title || task.name}
																				</Typography>
																				{task.description && (
																					<Typography
																						variant="body2"
																						color="text.secondary"
																						className="mt-1"
																					>
																						{task.description}
																					</Typography>
																				)}
																				<Box className="flex gap-2 mt-2">
																					<Chip
																						label={task.status}
																						size="small"
																						variant="outlined"
																					/>
																					<Chip
																						label={task.priority}
																						size="small"
																						color={
																							getPriorityColor(
																								task.priority
																							) as any
																						}
																					/>
																					{task.dueDate && (
																						<Chip
																							label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
																							size="small"
																							variant="outlined"
																							className="text-xs"
																						/>
																					)}
																				</Box>
																				{task.assignedTo && (
																					<Typography
																						variant="caption"
																						color="text.secondary"
																						className="block mt-2"
																					>
																						👤 {task.assignedTo.firstName}{' '}
																						{task.assignedTo.lastName}
																					</Typography>
																				)}
																			</Box>
																			<Box className="flex items-start gap-1">
																				<IconButton
																					size="small"
																					color="error"
																					onClick={() =>
																						handleDeleteTask(
																							task._id,
																							task.title ||
																								task.name ||
																								'Unnamed Task'
																						)
																					}
																					title={`Delete task "${task.title || task.name}"`}
																				>
																					<DeleteIcon fontSize="small" />
																				</IconButton>
																			</Box>
																		</Box>
																	</CardContent>
																</Card>
															))}
														</Box>
													</Box>
												) : (
													<Box className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
														<Typography
															variant="body2"
															color="text.secondary"
														>
															No tasks in this stage yet
														</Typography>
														<Button
															size="small"
															variant="text"
															startIcon={<AddIcon />}
															onClick={() =>
																handleOpenAddTasksToStage(stage._id, stage.name)
															}
															className="mt-2"
														>
															Add First Task
														</Button>
													</Box>
												)}
											</CardContent>
										</Card>
									);
								})}
							</Box>

							{/* Unassigned Tasks Section */}
							{(() => {
								const unassignedTasks = getUnassignedTasks();
								return unassignedTasks.length > 0 ? (
									<Card
										variant="outlined"
										className="mt-4 border-l-4 border-l-orange-500"
									>
										<CardContent className="p-4">
											<Typography
												variant="h6"
												className="mb-3 text-orange-700"
											>
												📌 Unassigned Tasks
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												className="mb-3"
											>
												These tasks are not assigned to any stage
											</Typography>
											<Box className="space-y-2">
												{unassignedTasks.map((task) => (
													<Card
														key={task._id}
														className="bg-orange-50 border border-orange-200"
													>
														<CardContent className="p-3">
															<Box className="flex items-start justify-between">
																<Box className="flex-1">
																	<Typography
																		variant="subtitle2"
																		className="font-medium"
																	>
																		{task.title || task.name}
																	</Typography>
																	{task.description && (
																		<Typography
																			variant="body2"
																			color="text.secondary"
																			className="mt-1"
																		>
																			{task.description}
																		</Typography>
																	)}
																	<Box className="flex gap-2 mt-2">
																		<Chip
																			label={task.status}
																			size="small"
																			variant="outlined"
																		/>
																		<Chip
																			label={task.priority}
																			size="small"
																			color={
																				getPriorityColor(task.priority) as any
																			}
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
																		<Typography
																			variant="caption"
																			color="text.secondary"
																			className="block mt-2"
																		>
																			👤 {task.assignedTo.firstName}{' '}
																			{task.assignedTo.lastName}
																		</Typography>
																	)}
																</Box>
																<Box className="flex items-start gap-1">
																	<IconButton
																		size="small"
																		color="error"
																		onClick={() =>
																			handleDeleteTask(
																				task._id,
																				task.title ||
																					task.name ||
																					'Unnamed Task'
																			)
																		}
																		title={`Delete task "${task.title || task.name}"`}
																	>
																		<DeleteIcon fontSize="small" />
																	</IconButton>
																</Box>
															</Box>
														</CardContent>
													</Card>
												))}
											</Box>
										</CardContent>
									</Card>
								) : null;
							})()}
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="p-5">
							<Box className="flex items-center justify-between mb-12">
								<Typography variant="h6">Workflow Stages & Tasks</Typography>
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
							<Box className="text-center py-16">
								<Typography
									variant="h6"
									color="text.secondary"
									className="mb-4"
								>
									🚀 Ready to get started?
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									className="mb-4"
								>
									Create your first stage or import from a template to begin organizing your workflow
								</Typography>
								<Box className="flex justify-center gap-2">
									<Button
										variant="contained"
										startIcon={<ImportIcon />}
										onClick={() => handleOpenImportDialog('workflow')}
									>
										Import Template
									</Button>
									<Button
										variant="outlined"
										startIcon={<AddIcon />}
										onClick={() => setAddStageDialogOpen(true)}
									>
										Create Stage
									</Button>
								</Box>
							</Box>
						</CardContent>
					</Card>
				)}

				{/* Documents */}
				{caseDetails.documents && caseDetails.documents.length > 0 && (
					<Card>
						<CardContent className="p-5">
							<Typography
								variant="h6"
								className="mb-12"
							>
								Documents
							</Typography>
							<List dense>
								{caseDetails.documents.map((document) => (
									<ListItem
										key={document._id}
										divider
									>
										<ListItemText
											primary={document.originalName}
											secondary={
												<Box>
													<Typography variant="body2">
														Size: {(document.size / 1024).toFixed(2)} KB
													</Typography>
													<Typography
														variant="caption"
														color="text.secondary"
													>
														Uploaded by: {document.uploadedBy.firstName}{' '}
														{document.uploadedBy.lastName} on{' '}
														{new Date(document.uploadedAt).toLocaleDateString()}
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

			{/* Add Tasks to Stage Dialog */}
			<AddTasksToStageDialog
				open={addTasksToStageDialogOpen}
				onClose={() => setAddTasksToStageDialogOpen(false)}
				onSuccess={handleTasksAddedToStage}
				caseId={caseDetails._id}
				stageId={selectedStageId}
				stageName={selectedStageName}
			/>

			{/* Confirmation Dialog */}
			<Dialog
				open={confirmDialogOpen}
				onClose={handleConfirmDialogClose}
				aria-labelledby="confirm-dialog-title"
				aria-describedby="confirm-dialog-description"
			>
				<DialogTitle id="confirm-dialog-title">{confirmDialogData?.title}</DialogTitle>
				<DialogContent>
					<DialogContentText id="confirm-dialog-description">{confirmDialogData?.message}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleConfirmDialogClose}
						color="primary"
					>
						{confirmDialogData?.cancelText || 'Cancel'}
					</Button>
					<Button
						onClick={handleConfirmDialogConfirm}
						color="error"
						variant="contained"
						autoFocus
					>
						{confirmDialogData?.confirmText || 'Delete'}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default CaseDetails;
