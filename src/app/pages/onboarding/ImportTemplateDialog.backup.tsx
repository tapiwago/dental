import { useState, useEffect } from 'react';
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
	Tabs,
	Tab,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	CircularProgress
} from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	AccountTree as WorkflowIcon,
	Assignment as StageIcon,
	Task as TaskIcon
} from '@mui/icons-material';
import { templateApi, stageApi, taskApi, fetchJson } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface ImportTemplateDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	caseId: string;
	existingStageId?: string; // If importing to specific stage
	importType: 'workflow' | 'stage' | 'task';
}

interface Template {
	_id: string;
	templateId: string;
	name: string;
	description?: string;
	type: 'OnboardingCase' | 'Stage' | 'Task' | 'WorkflowGuide';
	configuration: {
		defaultStages?: {
			name: string;
			sequence: number;
			description?: string;
			estimatedDuration?: number;
			isRequired: boolean;
			tasks?: {
				name: string;
				description?: string;
				estimatedHours?: number;
				isRequired: boolean;
				priority: string;
				skillsRequired: string[];
			}[];
		}[];
	};
	tags: string[];
	industryType: string;
	complexity: string;
}

function ImportTemplateDialog({
	open,
	onClose,
	onSuccess,
	caseId,
	existingStageId,
	importType
}: ImportTemplateDialogProps) {
	const { data: user } = useUser();
	const [loading, setLoading] = useState(false);
	const [importing, setImporting] = useState(false);
	const [error, setError] = useState('');
	const [currentTab, setCurrentTab] = useState(0);

	// Template selection
	const [templates, setTemplates] = useState<Template[]>([]);
	const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
	const [selectedStages, setSelectedStages] = useState<string[]>([]);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

	useEffect(() => {
		if (open) {
			fetchTemplates();
		}
	}, [open, importType]);

	const fetchTemplates = async () => {
		try {
			setLoading(true);
			setError('');

			// Filter templates based on import type
			const templateType =
				importType === 'workflow' ? 'OnboardingCase' : importType === 'stage' ? 'Stage' : 'Task';

			const params = new URLSearchParams({
				type: templateType,
				status: 'Published'
			});

			const response = await templateApi.getAll(params);
			const data = await fetchJson(response);

			if (data.templates) {
				setTemplates(data.templates);
			} else if (Array.isArray(data)) {
				setTemplates(data);
			}
		} catch (error: any) {
			console.error('Error fetching templates:', error);
			setError('Failed to load templates');
		} finally {
			setLoading(false);
		}
	};

	const handleTemplateSelect = (template: Template) => {
		setSelectedTemplate(template);
		setSelectedStages([]);
		setSelectedTasks([]);
		setCurrentTab(1);
	};

	const handleStageToggle = (stageIndex: number) => {
		const stageKey = `stage-${stageIndex}`;
		setSelectedStages((prev) =>
			prev.includes(stageKey) ? prev.filter((s) => s !== stageKey) : [...prev, stageKey]
		);
	};

	const handleTaskToggle = (stageIndex: number, taskIndex: number) => {
		const taskKey = `task-${stageIndex}-${taskIndex}`;
		setSelectedTasks((prev) => (prev.includes(taskKey) ? prev.filter((t) => t !== taskKey) : [...prev, taskKey]));
	};

	const handleImport = async () => {
		if (!selectedTemplate || !user?.id) {
			setError('Template and user information required');
			return;
		}

		try {
			setImporting(true);
			setError('');

			if (importType === 'workflow') {
				await importWorkflow();
			} else if (importType === 'stage') {
				await importStages();
			} else {
				await importTasks();
			}

			onSuccess();
			onClose();
		} catch (error: any) {
			console.error('Error importing template:', error);
			setError(error.message || 'Failed to import template');
		} finally {
			setImporting(false);
		}
	};

	const importWorkflow = async () => {
		if (!selectedTemplate.configuration.defaultStages) return;

		// Get existing stages to determine next sequence number
		const params = new URLSearchParams();
		params.append('onboardingCaseId', caseId);
		const existingStagesResponse = await stageApi.getAll(params);
		const existingStagesData = await fetchJson(existingStagesResponse);
		const existingStages = Array.isArray(existingStagesData) ? existingStagesData : existingStagesData.stages || [];
		const maxSequence =
			existingStages.length > 0 ? Math.max(...existingStages.map((s: any) => s.sequence || 0)) : 0;

		for (const [index, stage] of selectedTemplate.configuration.defaultStages.entries()) {
			const stageKey = `stage-${index}`;

			if (!selectedStages.includes(stageKey)) continue;

			// Create stage
			const stageData = {
				stageId: `${caseId}-STG-${maxSequence + index + 1}`,
				name: stage.name,
				description: stage.description,
				sequence: maxSequence + index + 1,
				onboardingCaseId: caseId,
				estimatedDuration: stage.estimatedDuration,
				isRequired: stage.isRequired,
				createdBy: user.id
			};

			const stageResponse = await stageApi.create(stageData);
			const createdStage = await fetchJson(stageResponse);

			// Create tasks for this stage
			if (stage.tasks) {
				for (const [taskIndex, task] of stage.tasks.entries()) {
					const taskKey = `task-${index}-${taskIndex}`;

					if (!selectedTasks.includes(taskKey)) continue;

					const taskData = {
						taskId: `${caseId}-TSK-${Date.now()}-${taskIndex}`,
						name: task.name,
						description: task.description,
						stageId: createdStage._id,
						onboardingCaseId: caseId,
						priority: task.priority,
						estimatedHours: task.estimatedHours,
						isRequired: task.isRequired,
						assignedTo: [user.id], // Assign to champion by default
						createdBy: user.id
					};

					await taskApi.create(taskData);
				}
			}
		}
	};

	const importStages = async () => {
		if (!selectedTemplate.configuration.defaultStages) return;

		// Get existing stages to determine next sequence number
		const params = new URLSearchParams();
		params.append('onboardingCaseId', caseId);
		const existingStagesResponse = await stageApi.getAll(params);
		const existingStagesData = await fetchJson(existingStagesResponse);
		const existingStages = Array.isArray(existingStagesData) ? existingStagesData : existingStagesData.stages || [];
		const maxSequence =
			existingStages.length > 0 ? Math.max(...existingStages.map((s: any) => s.sequence || 0)) : 0;

		for (const [index, stage] of selectedTemplate.configuration.defaultStages.entries()) {
			const stageKey = `stage-${index}`;

			if (!selectedStages.includes(stageKey)) continue;

			const stageData = {
				stageId: `${caseId}-STG-${maxSequence + index + 1}`,
				name: stage.name,
				description: stage.description,
				sequence: maxSequence + index + 1,
				onboardingCaseId: caseId,
				estimatedDuration: stage.estimatedDuration,
				isRequired: stage.isRequired,
				createdBy: user.id
			};

			const stageResponse = await stageApi.create(stageData);
			const createdStage = await fetchJson(stageResponse);

			// Create tasks for this stage
			if (stage.tasks) {
				for (const [taskIndex, task] of stage.tasks.entries()) {
					const taskKey = `task-${index}-${taskIndex}`;

					if (!selectedTasks.includes(taskKey)) continue;

					const taskData = {
						taskId: `${caseId}-TSK-${Date.now()}-${taskIndex}`,
						name: task.name,
						description: task.description,
						stageId: createdStage._id,
						onboardingCaseId: caseId,
						priority: task.priority,
						estimatedHours: task.estimatedHours,
						isRequired: task.isRequired,
						assignedTo: [user.id], // Assign to champion by default
						createdBy: user.id
					};

					await taskApi.create(taskData);
				}
			}
		}
	};

	const importTasks = async () => {
		if (!selectedTemplate.configuration.defaultStages || !existingStageId) return;

		for (const [stageIndex, stage] of selectedTemplate.configuration.defaultStages.entries()) {
			if (!stage.tasks) continue;

			for (const [taskIndex, task] of stage.tasks.entries()) {
				const taskKey = `task-${stageIndex}-${taskIndex}`;

				if (!selectedTasks.includes(taskKey)) continue;

				const taskData = {
					taskId: `${caseId}-TSK-${Date.now()}-${taskIndex}`,
					name: task.name,
					description: task.description,
					stageId: existingStageId,
					onboardingCaseId: caseId,
					priority: task.priority,
					estimatedHours: task.estimatedHours,
					isRequired: task.isRequired,
					assignedTo: [user.id], // Assign to champion by default
					createdBy: user.id
				};

				await taskApi.create(taskData);
			}
		}
	};

	const getImportTitle = () => {
		switch (importType) {
			case 'workflow':
				return 'Import Workflow Template';
			case 'stage':
				return 'Import Stage Template';
			case 'task':
				return 'Import Task Template';
			default:
				return 'Import Template';
		}
	};

	const getImportDescription = () => {
		switch (importType) {
			case 'workflow':
				return 'Select a workflow template to import all stages and tasks';
			case 'stage':
				return 'Select a stage template to import stages and their tasks';
			case 'task':
				return 'Select a template to import tasks into the current stage';
			default:
				return 'Select a template to import';
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
		>
			<DialogTitle>
				<Box className="flex items-center gap-8">
					{importType === 'workflow' && <WorkflowIcon />}
					{importType === 'stage' && <StageIcon />}
					{importType === 'task' && <TaskIcon />}
					{getImportTitle()}
				</Box>
			</DialogTitle>
			<DialogContent>
				<Typography
					variant="body2"
					color="text.secondary"
					className="mb-16"
				>
					{getImportDescription()}
				</Typography>

				{error && (
					<Alert
						severity="error"
						className="mb-16"
					>
						{error}
					</Alert>
				)}

				<Tabs
					value={currentTab}
					onChange={(_, newValue) => setCurrentTab(newValue)}
				>
					<Tab label="Select Template" />
					<Tab
						label="Configure Import"
						disabled={!selectedTemplate}
					/>
				</Tabs>

				{/* Template Selection Tab */}
				{currentTab === 0 && (
					<Box className="mt-16">
						{loading ? (
							<Box className="flex justify-center p-24">
								<CircularProgress />
							</Box>
						) : templates.length === 0 ? (
							<Alert severity="info">No published templates found for {importType} import.</Alert>
						) : (
							<List>
								{templates.map((template) => (
									<ListItem
										key={template._id}
										onClick={() => handleTemplateSelect(template)}
										className={`border rounded mb-8 cursor-pointer hover:bg-gray-50 ${selectedTemplate?._id === template._id ? 'bg-blue-50 border-blue-300' : ''}`}
									>
										<ListItemText
											primary={template.name}
											secondary={
												<Box>
													<Typography variant="body2">{template.description}</Typography>
													<Box className="flex gap-4 mt-4">
														<Chip
															label={template.industryType}
															size="small"
														/>
														<Chip
															label={template.complexity}
															size="small"
														/>
														{template.tags.slice(0, 3).map((tag, index) => (
															<Chip
																key={index}
																label={tag}
																size="small"
																variant="outlined"
															/>
														))}
													</Box>
												</Box>
											}
										/>
									</ListItem>
								))}
							</List>
						)}
					</Box>
				)}

				{/* Configuration Tab */}
				{currentTab === 1 && selectedTemplate && (
					<Box className="mt-16">
						<Typography
							variant="h6"
							className="mb-16"
						>
							Configure Import: {selectedTemplate.name}
						</Typography>

						{selectedTemplate.configuration.defaultStages &&
							selectedTemplate.configuration.defaultStages.length > 0 && (
								<Box>
									<Typography
										variant="subtitle1"
										className="mb-8"
									>
										Select Stages and Tasks to Import
									</Typography>

									{selectedTemplate.configuration.defaultStages.map((stage, stageIndex) => (
										<Accordion key={stageIndex}>
											<AccordionSummary expandIcon={<ExpandMoreIcon />}>
												<Box className="flex items-center gap-8">
													<Checkbox
														checked={selectedStages.includes(`stage-${stageIndex}`)}
														onChange={() => handleStageToggle(stageIndex)}
														onClick={(e) => e.stopPropagation()}
													/>
													<Typography variant="subtitle2">{stage.name}</Typography>
													{stage.isRequired && (
														<Chip
															label="Required"
															size="small"
															color="error"
														/>
													)}
												</Box>
											</AccordionSummary>
											<AccordionDetails>
												<Box className="pl-32">
													<Typography
														variant="body2"
														color="text.secondary"
														className="mb-8"
													>
														{stage.description}
													</Typography>

													{stage.tasks && stage.tasks.length > 0 && (
														<Box>
															<Typography
																variant="subtitle2"
																className="mb-8"
															>
																Tasks ({stage.tasks.length})
															</Typography>
															<List dense>
																{stage.tasks.map((task, taskIndex) => (
																	<ListItem
																		key={taskIndex}
																		className="pl-0"
																	>
																		<ListItemIcon>
																			<Checkbox
																				checked={selectedTasks.includes(
																					`task-${stageIndex}-${taskIndex}`
																				)}
																				onChange={() =>
																					handleTaskToggle(
																						stageIndex,
																						taskIndex
																					)
																				}
																			/>
																		</ListItemIcon>
																		<ListItemText
																			primary={task.name}
																			secondary={
																				<Box className="flex gap-4 mt-4">
																					<Chip
																						label={task.priority}
																						size="small"
																					/>
																					{task.isRequired && (
																						<Chip
																							label="Required"
																							size="small"
																							color="error"
																						/>
																					)}
																					{task.estimatedHours && (
																						<Chip
																							label={`${task.estimatedHours}h`}
																							size="small"
																							variant="outlined"
																						/>
																					)}
																				</Box>
																			}
																		/>
																	</ListItem>
																))}
															</List>
														</Box>
													)}
												</Box>
											</AccordionDetails>
										</Accordion>
									))}
								</Box>
							)}
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button
					onClick={onClose}
					disabled={importing}
				>
					Cancel
				</Button>
				<Button
					onClick={handleImport}
					variant="contained"
					disabled={
						importing || !selectedTemplate || (selectedStages.length === 0 && selectedTasks.length === 0)
					}
				>
					{importing ? 'Importing...' : 'Import Selected'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ImportTemplateDialog;
