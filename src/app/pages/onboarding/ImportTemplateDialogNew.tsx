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
import { Assignment as StageIcon, Task as TaskIcon } from '@mui/icons-material';
import { templateApi, stageApi, fetchJson } from '@/utils/authFetch';
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
	tasks: {
		name: string;
		description: string;
		priority: string;
		estimatedHours: number;
		isRequired?: boolean;
	}[];
}

interface Template {
	_id: string;
	name: string;
	description: string;
	type: string;
	estimatedDuration?: number;
	isRequired?: boolean;
	configuration?: {
		tasks?: {
			name: string;
			description: string;
			priority: string;
			estimatedHours: number;
			isRequired?: boolean;
		}[];
		defaultStages?: {
			name: string;
			description: string;
			sequence: number;
			tasks: {
				name: string;
				description: string;
				priority: string;
				estimatedHours: number;
			}[];
		}[];
	};
}

const ImportTemplateDialog: React.FC<ImportTemplateDialogProps> = ({ open, onClose, onSuccess, caseId }) => {
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
		console.log('Fetching workflow stages...');

		try {
			// Fetch all templates
			const response = await templateApi.getAll();
			const data = await fetchJson(response);
			console.log('API Response:', data);

			// Handle different response structures
			const templates = data.templates || data || [];
			console.log('All templates:', templates);

			// Filter for Stage type templates
			const stageTemplates = templates.filter((template: Template) => template.type === 'Stage');
			console.log('Stage templates found:', stageTemplates);

			// Convert Stage templates to WorkflowStage format
			const stages: WorkflowStage[] = stageTemplates.map((template: Template) => ({
				id: template._id,
				name: template.name,
				description: template.description || '',
				sequence: 1, // Default sequence, will be adjusted when importing
				workflowName: 'Stage Templates',
				estimatedDuration: template.estimatedDuration,
				isRequired: template.isRequired,
				tasks: template.configuration?.tasks || []
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
		setSelectedStages((prev) =>
			prev.includes(stageId) ? prev.filter((id) => id !== stageId) : [...prev, stageId]
		);
	};

	const handleImport = async () => {
		if (selectedStages.length === 0) {
			setError('Please select at least one stage to import');
			return;
		}

		setLoading(true);
		setError(null);
		console.log('Starting import for selected stages:', selectedStages);

		try {
			// Prepare stages data for the new bulk endpoint
			const stagesToImport = selectedStages
				.map((stageId) => {
					const stageTemplate = workflowStages.find((s) => s.id === stageId);

					if (!stageTemplate) return null;

					return {
						name: stageTemplate.name,
						description: stageTemplate.description,
						createdBy: currentUser?.id || currentUser?._id,
						estimatedDuration: stageTemplate.estimatedDuration || 0,
						isRequired: stageTemplate.isRequired !== false,
						tasks: stageTemplate.tasks.map((task) => ({
							name: task.name,
							description: task.description,
							priority: task.priority || 'Medium', // Use proper enum value
							estimatedHours: task.estimatedHours || 1,
							createdBy: currentUser?.id || currentUser?._id,
							isRequired: task.isRequired !== false
						}))
					};
				})
				.filter(Boolean); // Remove null entries

			console.log('Stages to import:', stagesToImport);

			// Use the new bulk endpoint to create stages with tasks
			const response = await stageApi.createWithTasks({
				stages: stagesToImport,
				onboardingCase: caseId
			});

			const result = await fetchJson(response);
			console.log('Import result:', result);

			console.log('Import completed successfully');
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
	const groupedStages = workflowStages.reduce(
		(acc, stage) => {
			if (!acc[stage.workflowName]) {
				acc[stage.workflowName] = [];
			}

			acc[stage.workflowName].push(stage);
			return acc;
		},
		{} as Record<string, WorkflowStage[]>
	);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
		>
			<DialogTitle>
				Import Stage Templates
				<Typography
					variant="body2"
					color="textSecondary"
					sx={{ mt: 1 }}
				>
					Select stage templates to add to your onboarding case
				</Typography>
			</DialogTitle>

			<DialogContent>
				{error && (
					<Alert
						severity="error"
						sx={{ mb: 2 }}
					>
						{error}
					</Alert>
				)}

				{loading ? (
					<Box
						display="flex"
						justifyContent="center"
						p={3}
					>
						<CircularProgress />
					</Box>
				) : (
					<Box>
						{Object.keys(groupedStages).length === 0 ? (
							<Typography
								variant="body2"
								color="textSecondary"
								textAlign="center"
								py={3}
							>
								No stage templates available to import
							</Typography>
						) : (
							Object.entries(groupedStages).map(([workflowName, stages]) => (
								<Card
									key={workflowName}
									sx={{ mb: 2 }}
								>
									<CardContent>
										<Typography
											variant="h6"
											sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
										>
											<StageIcon sx={{ mr: 1 }} />
											{workflowName}
										</Typography>

										<List dense>
											{stages.map((stage) => (
												<ListItem
													key={stage.id}
													sx={{ px: 0 }}
												>
													<ListItemIcon>
														<Checkbox
															checked={selectedStages.includes(stage.id)}
															onChange={() => handleStageToggle(stage.id)}
														/>
													</ListItemIcon>
													<ListItemText
														primary={
															<Box
																display="flex"
																alignItems="center"
																gap={1}
															>
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
								<Typography
									variant="subtitle2"
									gutterBottom
								>
									Selected Stages ({selectedStages.length}):
								</Typography>
								<Box
									display="flex"
									flexWrap="wrap"
									gap={1}
								>
									{selectedStages.map((stageId) => {
										const stage = workflowStages.find((s) => s.id === stageId);
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
				<Button onClick={handleClose}>Cancel</Button>
				<Button
					onClick={handleImport}
					variant="contained"
					disabled={loading || selectedStages.length === 0}
				>
					{loading
						? 'Importing...'
						: `Import ${selectedStages.length} Stage${selectedStages.length !== 1 ? 's' : ''}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ImportTemplateDialog;
