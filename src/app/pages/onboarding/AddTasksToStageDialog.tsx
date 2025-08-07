import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Checkbox,
	Chip,
	Alert,
	CircularProgress,
	Card,
	CardContent,
	Divider
} from '@mui/material';
import {
	Task as TaskIcon,
	Assignment as StageIcon
} from '@mui/icons-material';
import { templateApi, taskApi, fetchJson } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface AddTasksToStageDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	caseId: string;
	stageId: string;
	stageName?: string;
}

interface TaskTemplate {
	id: string;
	name: string;
	description: string;
	priority: string;
	estimatedHours: number;
	isRequired?: boolean;
	workflowName: string;
}

interface Template {
	_id: string;
	name: string;
	description: string;
	type: string;
	priority?: string;
	estimatedHours?: number;
	isRequired?: boolean;
	configuration?: {
		priority?: string;
		estimatedHours?: number;
		isRequired?: boolean;
	};
}

const AddTasksToStageDialog: React.FC<AddTasksToStageDialogProps> = ({
	open,
	onClose,
	onSuccess,
	caseId,
	stageId,
	stageName
}) => {
	const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { data: currentUser } = useUser();

	useEffect(() => {
		if (open) {
			fetchTaskTemplates();
		}
	}, [open]);

	const fetchTaskTemplates = async () => {
		setLoading(true);
		setError(null);
		console.log('Fetching task templates...');
		
		try {
			// Fetch all templates
			const response = await templateApi.getAll();
			const data = await fetchJson(response);
			console.log('API Response:', data);
			
			// Handle different response structures
			const templates = data.templates || data || [];
			console.log('All templates:', templates);
			
			// Filter for Task type templates
			const taskTemplates = templates.filter(
				(template: Template) => template.type === 'Task'
			);
			console.log('Task templates found:', taskTemplates);

			// Convert Task templates to TaskTemplate format
			const tasks: TaskTemplate[] = taskTemplates.map((template: Template) => ({
				id: template._id,
				name: template.name,
				description: template.description || '',
				priority: template.priority || template.configuration?.priority || 'Medium',
				estimatedHours: template.estimatedHours || template.configuration?.estimatedHours || 1,
				isRequired: template.isRequired ?? template.configuration?.isRequired ?? false,
				workflowName: 'Task Templates'
			}));

			console.log('Converted tasks:', tasks);
			setTaskTemplates(tasks);
		} catch (err) {
			console.error('Error fetching task templates:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch task templates');
		} finally {
			setLoading(false);
		}
	};

	const handleTaskToggle = (taskId: string) => {
		setSelectedTasks(prev =>
			prev.includes(taskId)
				? prev.filter(id => id !== taskId)
				: [...prev, taskId]
		);
	};

	const handleAddTasks = async () => {
		if (selectedTasks.length === 0) {
			setError('Please select at least one task to add');
			return;
		}

		setLoading(true);
		setError(null);
		console.log('Starting task addition for selected tasks:', selectedTasks);

		try {
			// Prepare tasks data for the API endpoint
			const tasksToAdd = selectedTasks.map(taskId => {
				const taskTemplate = taskTemplates.find(t => t.id === taskId);
				if (!taskTemplate) return null;

				return {
					name: taskTemplate.name,
					description: taskTemplate.description,
					priority: taskTemplate.priority,
					status: 'Not Started',
					estimatedHours: taskTemplate.estimatedHours,
					isRequired: taskTemplate.isRequired,
					createdBy: currentUser?.id || currentUser?._id,
					stageId: stageId,
					onboardingCaseId: caseId
				};
			}).filter(Boolean); // Remove null entries

			console.log('Tasks to add:', tasksToAdd);

			// Use the tasks/multiple endpoint
			const response = await taskApi.createMultiple({
				tasks: tasksToAdd,
				stage: stageId,
				onboardingCase: caseId
			});

			const result = await fetchJson(response);
			console.log('Add tasks result:', result);

			console.log('Tasks added successfully');
			onSuccess();
			onClose();
		} catch (err) {
			console.error('Error adding tasks:', err);
			setError(err instanceof Error ? err.message : 'Failed to add tasks');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setSelectedTasks([]);
		setError(null);
		onClose();
	};

	// Group tasks by workflow
	const groupedTasks = taskTemplates.reduce((acc, task) => {
		if (!acc[task.workflowName]) {
			acc[task.workflowName] = [];
		}
		acc[task.workflowName].push(task);
		return acc;
	}, {} as Record<string, TaskTemplate[]>);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>
				Add Task Templates to Stage
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					{stageName && (
						<>
							Adding tasks to stage: <strong>{stageName}</strong>
							<br />
						</>
					)}
					Select task templates to add to this stage
				</Typography>
			</DialogTitle>
			
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{loading ? (
					<Box display="flex" justifyContent="center" p={3}>
						<CircularProgress />
					</Box>
				) : (
					<Box>
						{Object.keys(groupedTasks).length === 0 ? (
							<Typography variant="body2" color="textSecondary" textAlign="center" py={3}>
								No task templates available to add
							</Typography>
						) : (
							Object.entries(groupedTasks).map(([workflowName, tasks]) => (
								<Card key={workflowName} sx={{ mb: 2 }}>
									<CardContent>
										<Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
											<TaskIcon sx={{ mr: 1 }} />
											{workflowName}
										</Typography>
										
										<List dense>
											{tasks.map((task) => (
												<ListItem key={task.id} sx={{ px: 0 }}>
													<ListItemIcon>
														<Checkbox
															checked={selectedTasks.includes(task.id)}
															onChange={() => handleTaskToggle(task.id)}
														/>
													</ListItemIcon>
													<ListItemText
														primary={
															<Box display="flex" alignItems="center" gap={1}>
																<Typography variant="subtitle2">
																	{task.name}
																</Typography>
																<Chip 
																	label={task.priority} 
																	size="small" 
																	variant="outlined"
																	color={
																		task.priority === 'Critical' ? 'error' :
																		task.priority === 'High' ? 'warning' :
																		task.priority === 'Medium' ? 'info' : 'default'
																	}
																/>
																<Chip 
																	label={`${task.estimatedHours}h`} 
																	size="small" 
																	variant="outlined" 
																/>
																{task.isRequired && (
																	<Chip 
																		label="Required" 
																		size="small" 
																		variant="outlined"
																		color="secondary"
																	/>
																)}
															</Box>
														}
														secondary={task.description}
													/>
												</ListItem>
											))}
										</List>
									</CardContent>
								</Card>
							))
						)}

						{selectedTasks.length > 0 && (
							<Box mt={2}>
								<Divider sx={{ mb: 2 }} />
								<Typography variant="subtitle2" gutterBottom>
									Selected Tasks ({selectedTasks.length}):
								</Typography>
								<Box display="flex" flexWrap="wrap" gap={1}>
									{selectedTasks.map(taskId => {
										const task = taskTemplates.find(t => t.id === taskId);
										return task ? (
											<Chip
												key={taskId}
												label={task.name}
												onDelete={() => handleTaskToggle(taskId)}
												size="small"
												icon={<TaskIcon />}
											/>
										) : null;
									})}
								</Box>
							</Box>
						)}
					</Box>
				)}
			</DialogContent>
			
			<DialogActions>
				<Button onClick={handleClose}>
					Cancel
				</Button>
				<Button
					onClick={handleAddTasks}
					variant="contained"
					disabled={loading || selectedTasks.length === 0}
					startIcon={<TaskIcon />}
				>
					{loading ? 'Adding...' : `Add ${selectedTasks.length} Task${selectedTasks.length !== 1 ? 's' : ''}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AddTasksToStageDialog;
