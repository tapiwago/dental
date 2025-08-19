import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Box,
	Alert,
	FormControlLabel,
	Switch,
	Tabs,
	Tab,
	Checkbox,
	ListItemText,
	OutlinedInput,
	Chip,
	CircularProgress,
	Card,
	CardContent
} from '@mui/material';
import { Assignment as StageIcon, Task as TaskIcon } from '@mui/icons-material';
import { stageApi, taskApi, templateApi, fetchJson } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface AddStageDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	caseId: string;
}

interface StageTemplate {
	_id: string;
	name: string;
	description: string;
	type: string;
	configuration?: {
		sequence?: number;
		estimatedDuration?: number;
		isRequired?: boolean;
		tasks?: {
			name: string;
			description: string;
			priority: string;
			estimatedHours: number;
		}[];
	};
}

function AddStageDialog({ open, onClose, onSuccess, caseId }: AddStageDialogProps) {
	const { data: user } = useUser();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [activeTab, setActiveTab] = useState(0);

	// Manual entry fields
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [sequence, setSequence] = useState('');
	const [estimatedDuration, setEstimatedDuration] = useState('');
	const [isRequired, setIsRequired] = useState(true);

	// Template fields
	const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>([]);
	const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
	const [loadingTemplates, setLoadingTemplates] = useState(false);

	useEffect(() => {
		if (open && activeTab === 1) {
			fetchStageTemplates();
		}
	}, [open, activeTab]);

	const fetchStageTemplates = async () => {
		setLoadingTemplates(true);
		try {
			const response = await templateApi.getAll();
			const data = await fetchJson(response);

			// Handle different response structures and filter for Stage type templates
			const templates = data.templates || data || [];
			const stageTemplates = templates.filter((template: StageTemplate) => template.type === 'Stage');

			setStageTemplates(stageTemplates);
		} catch (error) {
			console.error('Error fetching stage templates:', error);
			setError('Failed to load stage templates');
		} finally {
			setLoadingTemplates(false);
		}
	};

	const validateForm = () => {
		if (activeTab === 0) {
			// Manual entry validation
			if (!name.trim()) {
				setError('Stage name is required');
				return false;
			}

			if (!sequence.trim() || isNaN(Number(sequence))) {
				setError('Valid sequence number is required');
				return false;
			}
		} else {
			// Template validation
			if (selectedTemplates.length === 0) {
				setError('Please select at least one stage template');
				return false;
			}
		}

		if (!user?.id) {
			setError('User information not available');
			return false;
		}

		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		try {
			setLoading(true);
			setError('');

			if (activeTab === 0) {
				// Manual entry
				await createManualStage();
			} else {
				// Template import
				await createStagesFromTemplates();
			}

			onSuccess();
			onClose();
			resetForm();
		} catch (error: any) {
			console.error('Error creating stage(s):', error);
			setError('Failed to create stage(s). Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const createManualStage = async () => {
		const stageData = {
			name: name.trim(),
			description: description.trim() || undefined,
			sequence: parseInt(sequence),
			onboardingCaseId: caseId,
			status: 'Not Started',
			estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
			isRequired,
			createdBy: user.id
		};

		const response = await stageApi.create(stageData);
		const data = await fetchJson(response);

		if (!data._id) {
			throw new Error(data.error || 'Failed to create stage');
		}
	};

	const createStagesFromTemplates = async () => {
		// Get current highest sequence number for the case
		const params = new URLSearchParams();
		params.append('onboardingCase', caseId);
		const existingStagesResponse = await stageApi.getAll(params);
		const existingStagesData = await fetchJson(existingStagesResponse);

		let maxSequence = 0;

		if (existingStagesData && Array.isArray(existingStagesData)) {
			maxSequence = Math.max(0, ...existingStagesData.map((stage: any) => stage.sequence || 0));
		}

		// Create stages from selected templates
		for (const templateId of selectedTemplates) {
			const template = stageTemplates.find((t) => t._id === templateId);

			if (!template) continue;

			maxSequence += 1;

			const stageData = {
				name: template.name,
				description: template.description || '',
				sequence: maxSequence,
				onboardingCaseId: caseId,
				status: 'Not Started',
				estimatedDuration: template.configuration?.estimatedDuration || 0,
				isRequired: template.configuration?.isRequired ?? true,
				createdBy: user.id
			};

			const stageResponse = await stageApi.create(stageData);
			const createdStage = await fetchJson(stageResponse);

			if (createdStage && template.configuration?.tasks?.length > 0) {
				// Create tasks for this stage
				for (let taskIndex = 0; taskIndex < template.configuration.tasks.length; taskIndex++) {
					const task = template.configuration.tasks[taskIndex];

					const taskData = {
						name: task.name,
						description: task.description,
						priority: task.priority || 'Medium',
						status: 'Not Started',
						sequence: taskIndex + 1,
						stageId: createdStage._id,
						onboardingCaseId: caseId,
						estimatedHours: task.estimatedHours || 1,
						createdBy: user.id,
						isRequired: true
					};

					await taskApi.create(taskData);
				}
			}
		}
	};

	const resetForm = () => {
		setName('');
		setDescription('');
		setSequence('');
		setEstimatedDuration('');
		setIsRequired(true);
		setSelectedTemplates([]);
		setActiveTab(0);
	};

	const handleClose = () => {
		setError('');
		resetForm();
		onClose();
	};

	const handleTemplateChange = (event: any) => {
		const value = event.target.value;
		setSelectedTemplates(typeof value === 'string' ? value.split(',') : value);
	};

	const renderManualEntry = () => (
		<Box className="space-y-16">
			<TextField
				label="Stage Name"
				value={name}
				onChange={(e) => setName(e.target.value)}
				fullWidth
				required
			/>

			<TextField
				label="Description"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				multiline
				rows={3}
				fullWidth
			/>

			<Box className="grid grid-cols-2 gap-16">
				<TextField
					label="Sequence Number"
					value={sequence}
					onChange={(e) => setSequence(e.target.value)}
					type="number"
					required
					helperText="Order in which this stage appears"
				/>

				<TextField
					label="Estimated Duration (days)"
					value={estimatedDuration}
					onChange={(e) => setEstimatedDuration(e.target.value)}
					type="number"
					helperText="Expected completion time"
				/>
			</Box>

			<Box>
				<FormControlLabel
					control={
						<Switch
							checked={isRequired}
							onChange={(e) => setIsRequired(e.target.checked)}
						/>
					}
					label="Required Stage"
				/>
				<Typography
					variant="caption"
					color="text.secondary"
					className="block mt-4"
				>
					Whether this stage must be completed
				</Typography>
			</Box>
		</Box>
	);

	const renderTemplateSelection = () => (
		<Box>
			{loadingTemplates ? (
				<Box
					display="flex"
					justifyContent="center"
					p={3}
				>
					<CircularProgress />
				</Box>
			) : (
				<>
					<Typography
						variant="body2"
						color="text.secondary"
						className="mb-16"
					>
						Select multiple stage templates to add to your onboarding case. Each template will be created as
						a separate stage.
					</Typography>

					{stageTemplates.length === 0 ? (
						<Alert severity="info">
							No stage templates found. Create stage templates first to use this feature.
						</Alert>
					) : (
						<>
							<FormControl
								fullWidth
								className="mb-16"
							>
								<InputLabel>Select Stage Templates</InputLabel>
								<Select
									multiple
									value={selectedTemplates}
									onChange={handleTemplateChange}
									input={<OutlinedInput label="Select Stage Templates" />}
									renderValue={(selected) => (
										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
											{selected.map((value) => {
												const template = stageTemplates.find((t) => t._id === value);
												return (
													<Chip
														key={value}
														label={template?.name || value}
														size="small"
													/>
												);
											})}
										</Box>
									)}
								>
									{stageTemplates.map((template) => (
										<MenuItem
											key={template._id}
											value={template._id}
										>
											<Checkbox checked={selectedTemplates.indexOf(template._id) > -1} />
											<ListItemText
												primary={template.name}
												secondary={template.description}
											/>
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{selectedTemplates.length > 0 && (
								<Box>
									<Typography
										variant="subtitle2"
										className="mb-8"
									>
										Selected Templates ({selectedTemplates.length}):
									</Typography>
									{selectedTemplates.map((templateId) => {
										const template = stageTemplates.find((t) => t._id === templateId);
										return template ? (
											<Card
												key={templateId}
												sx={{ mb: 1 }}
											>
												<CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
													<Box
														display="flex"
														alignItems="center"
														gap={1}
													>
														<StageIcon fontSize="small" />
														<Typography variant="subtitle2">{template.name}</Typography>
														{template.configuration?.tasks?.length > 0 && (
															<Chip
																size="small"
																label={`${template.configuration.tasks.length} tasks`}
																icon={<TaskIcon />}
															/>
														)}
													</Box>
													{template.description && (
														<Typography
															variant="caption"
															color="text.secondary"
														>
															{template.description}
														</Typography>
													)}
												</CardContent>
											</Card>
										) : null;
									})}
								</Box>
							)}
						</>
					)}
				</>
			)}
		</Box>
	);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
		>
			<DialogTitle>Add Stage(s)</DialogTitle>
			<DialogContent>
				<Typography
					variant="body2"
					color="text.secondary"
					className="mb-16"
				>
					Add stages to the onboarding case manually or from templates.
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
					value={activeTab}
					onChange={(e, newValue) => setActiveTab(newValue)}
					className="mb-16"
				>
					<Tab label="Manual Entry" />
					<Tab label="From Templates" />
				</Tabs>

				{activeTab === 0 ? renderManualEntry() : renderTemplateSelection()}
			</DialogContent>
			<DialogActions>
				<Button
					onClick={handleClose}
					disabled={loading}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={loading || (activeTab === 1 && selectedTemplates.length === 0)}
				>
					{loading
						? 'Creating...'
						: activeTab === 0
							? 'Create Stage'
							: `Create ${selectedTemplates.length} Stage${selectedTemplates.length !== 1 ? 's' : ''}`}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default AddStageDialog;
