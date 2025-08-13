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
	Grid,
	Divider
} from '@mui/material';
import {
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
}

interface WorkflowStage {
	id: string;
	name: string;
	description: string;
	sequence: number;
	workflowName: string;
	estimatedDuration?: number;
	isRequired?: boolean;
	tasks: Array<{
		name: string;
		description: string;
		priority: string;
		estimatedHours: number;
		isRequired?: boolean;
	}>;
}

interface Template {
	_id: string;
	name: string;
	description: string;
	type: string;
	configuration?: {
		defaultStages?: Array<{
			name: string;
			description: string;
			sequence: number;
			tasks: Array<{
				name: string;
				description: string;
				priority: string;
				estimatedHours: number;
			}>;
		}>;
	};
}

const ImportTemplateDialog: React.FC<ImportTemplateDialogProps> = ({
	open,
	onClose,
	onSuccess,
	caseId
}) => {
	const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
	const [selectedStages, setSelectedStages] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { data: currentUser } = useUser();

	useEffect(() => {
		if (open) {
			fetchWorkflowStages();
		}
	}, [open]);

	const fetchWorkflowStages = async () => {
		setLoading(true);
		setError(null);
		try {
			// Fetch all templates
			const response = await templateApi.getAll();
			const data = await fetchJson(response);
			
			console.log('API Response:', data);
			
			// Handle different response structures
			const templates = data.templates || data || [];
			console.log('All templates:', templates);
			console.log('Template types found:', templates.map((t: Template) => t.type));
			
			// Filter for Stage type templates only
			const stageTemplates = templates.filter(
				(template: Template) => template.type === 'Stage'
			);
			console.log('Stage templates:', stageTemplates);

			// Convert each stage template to a WorkflowStage
			const stages: WorkflowStage[] = stageTemplates.map((template: Template, index: number) => ({
				id: template._id,
				name: template.name,
				description: template.description || '',
				sequence: index + 1, // Default sequence
				workflowName: 'Stage Templates', // Group all under one category
				tasks: template.configuration?.defaultStages?.[0]?.tasks || [] // Get tasks if available
			}));

			console.log('Converted stages:', stages);

			setWorkflowStages(stages);
		} catch (err) {
			console.error('Error fetching workflow stages:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch workflow stages');
		} finally {
			setLoading(false);
		}
	};

	const handleStageToggle = (stageId: string) => {
		setSelectedStages(prev =>
			prev.includes(stageId)
				? prev.filter(id => id !== stageId)
				: [...prev, stageId]
		);
	};

	const handleImport = async () => {
		if (selectedStages.length === 0) {
			setError('Please select at least one stage to import');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Get current highest sequence number for the case
			const params = new URLSearchParams();
			params.append('onboardingCase', caseId);
			const existingStagesResponse = await stageApi.getAll(params);
			const existingStagesData = await fetchJson(existingStagesResponse);
			
			let maxSequence = 0;
			if (existingStagesData && Array.isArray(existingStagesData)) {
				maxSequence = Math.max(0, ...existingStagesData.map((stage: any) => stage.sequence || 0));
			}

			// Import selected stages
			for (const stageId of selectedStages) {
				const stageTemplate = workflowStages.find(s => s.id === stageId);
				if (!stageTemplate) {
					console.log('Stage template not found for ID:', stageId);
					continue;
				}

				maxSequence += 1;
				console.log('Creating stage from template:', stageTemplate);

				const stageData = {
					name: stageTemplate.name,
					description: stageTemplate.description,
					sequence: maxSequence,
					onboardingCaseId: caseId,
					status: 'Not Started',
					createdBy: currentUser?.id || currentUser?._id,
					estimatedDuration: stageTemplate.estimatedDuration || 0,
					isRequired: stageTemplate.isRequired || true
				};

				console.log('Creating stage with data:', stageData);
				const stageResponse = await stageApi.create(stageData);
				const createdStage = await fetchJson(stageResponse);
				console.log('Created stage:', createdStage);
				
				if (createdStage && stageTemplate.tasks?.length > 0) {
					console.log('Creating tasks for stage:', stageTemplate.tasks);
					// Import tasks for this stage
					for (let taskIndex = 0; taskIndex < stageTemplate.tasks.length; taskIndex++) {
						const task = stageTemplate.tasks[taskIndex];
						
						const taskData = {
							name: task.name,
							description: task.description,
							priority: task.priority || 'Medium',
							status: 'Not Started',
							sequence: taskIndex + 1,
							stageId: createdStage._id,
							onboardingCaseId: caseId,
							estimatedHours: task.estimatedHours || 1,
							createdBy: currentUser?.id || currentUser?._id,
							isRequired: task.isRequired || true
						};

						console.log('Creating task with data:', taskData);
						await taskApi.create(taskData);
					}
				}
			}

			onSuccess();
			onClose();
		} catch (err) {
			console.error('Error importing stages:', err);
			setError(err instanceof Error ? err.message : 'Failed to import stages');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setSelectedStages([]);
		setError(null);
		onClose();
	};

	// Group stages by workflow
	const groupedStages = workflowStages.reduce((acc, stage) => {
		if (!acc[stage.workflowName]) {
			acc[stage.workflowName] = [];
		}
		acc[stage.workflowName].push(stage);
		return acc;
	}, {} as Record<string, WorkflowStage[]>);

	console.log('Workflow stages:', workflowStages);
	console.log('Grouped stages:', groupedStages);
	console.log('Number of grouped workflow keys:', Object.keys(groupedStages).length);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle>
				Import Workflow Stages
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Select individual stages from workflow templates to add to your onboarding case
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
						{Object.keys(groupedStages).length === 0 ? (
							<Typography variant="body2" color="textSecondary" textAlign="center" py={3}>
								No workflow stages available to import
							</Typography>
						) : (
							Object.entries(groupedStages).map(([workflowName, stages]) => (
								<Card key={workflowName} sx={{ mb: 2 }}>
									<CardContent>
										<Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
											<StageIcon sx={{ mr: 1 }} />
											{workflowName}
										</Typography>
										
										<List dense>
											{stages.map((stage) => (
												<ListItem key={stage.id} sx={{ px: 0 }}>
													<ListItemIcon>
														<Checkbox
															checked={selectedStages.includes(stage.id)}
															onChange={() => handleStageToggle(stage.id)}
														/>
													</ListItemIcon>
													<ListItemText
														primary={
															<Box display="flex" alignItems="center" gap={1}>
																<Typography variant="subtitle2">
																	{stage.name}
																</Typography>
																<Chip 
																	label={`Seq: ${stage.sequence}`} 
																	size="small" 
																	variant="outlined" 
																/>
																{stage.tasks.length > 0 && (
																	<Chip 
																		label={`${stage.tasks.length} tasks`} 
																		size="small" 
																		variant="outlined"
																		icon={<TaskIcon />}
																	/>
																)}
															</Box>
														}
														secondary={stage.description}
													/>
												</ListItem>
											))}
										</List>
									</CardContent>
								</Card>
							))
						)}

						{selectedStages.length > 0 && (
							<Box mt={2}>
								<Divider sx={{ mb: 2 }} />
								<Typography variant="subtitle2" gutterBottom>
									Selected Stages ({selectedStages.length}):
								</Typography>
								<Box display="flex" flexWrap="wrap" gap={1}>
									{selectedStages.map(stageId => {
										const stage = workflowStages.find(s => s.id === stageId);
										return stage ? (
											<Chip
												key={stageId}
												label={`${stage.workflowName}: ${stage.name}`}
												onDelete={() => handleStageToggle(stageId)}
												size="small"
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
					onClick={handleImport}
					variant="contained"
					disabled={loading || selectedStages.length === 0}
				>
					{loading ? 'Importing...' : `Import ${selectedStages.length} Stage${selectedStages.length !== 1 ? 's' : ''}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ImportTemplateDialog;
