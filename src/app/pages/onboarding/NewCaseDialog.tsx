import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	MenuItem,
	Box,
	FormControl,
	InputLabel,
	Select,
	Alert,
	CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { clientApi, userApi, onboardingApi, workflowTypeApi, fetchJson } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface Client {
	_id: string;
	name: string;
	email: string;
}

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
}

interface WorkflowType {
	_id: string;
	name: string;
	prefix: string;
	isDefault: boolean;
}

interface NewCaseDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface FormData {
	caseId: string;
	workflowTypeId: string;
	clientId: string;
	assignedChampion: string;
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	startDate: Date;
	expectedCompletionDate: Date | null;
	notes: string;
}

function NewCaseDialog({ open, onClose, onSuccess }: NewCaseDialogProps) {
	const { data: currentUser } = useUser();
	const [formData, setFormData] = useState<FormData>({
		caseId: '',
		workflowTypeId: '',
		clientId: '',
		assignedChampion: '',
		priority: 'Medium',
		startDate: new Date(),
		expectedCompletionDate: null,
		notes: ''
	});

	const [clients, setClients] = useState<Client[]>([]);
	const [champions, setChampions] = useState<User[]>([]);
	const [workflowTypes, setWorkflowTypes] = useState<WorkflowType[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		if (open) {
			fetchClients();
			fetchChampions();
			fetchWorkflowTypes();
			generateCaseId();
			setError('');
			setRetryCount(0);
		}
	}, [open]);

	const fetchClients = async () => {
		try {
			const response = await clientApi.getAll();
			const data = await fetchJson(response);
			setClients(data || []);
		} catch (error) {
			console.error('Error fetching clients:', error);
		}
	};

	const fetchChampions = async () => {
		try {
			const response = await userApi.getAll();
			const data = await fetchJson(response);
			// Filter champions on the client side for now
			const championRoles = ['Champion', 'Senior Champion', 'Admin'];
			const allUsers = data.users || [];
			const filteredChampions = allUsers.filter((user: User) => 
				championRoles.includes(user.role)
			);
			setChampions(filteredChampions);
		} catch (error) {
			console.error('Error fetching champions:', error);
		}
	};

	const fetchWorkflowTypes = async () => {
		try {
			const response = await workflowTypeApi.getAll();
			const data = await fetchJson(response);
			setWorkflowTypes(data.data || []);
			
			// Set default workflow type if available
			const defaultWorkflowType = data.data?.find((wt: WorkflowType) => wt.isDefault);
			if (defaultWorkflowType && !formData.workflowTypeId) {
				setFormData(prev => ({ ...prev, workflowTypeId: defaultWorkflowType._id }));
				// Generate case ID with the default workflow type prefix
				setTimeout(() => {
					generateCaseId(defaultWorkflowType._id);
				}, 0);
			}
		} catch (error) {
			console.error('Error fetching workflow types:', error);
		}
	};

	const generateCaseId = (workflowTypeId?: string) => {
		let prefix = 'OB'; // Default prefix
		
		if (workflowTypeId && workflowTypes.length > 0) {
			const selectedWorkflowType = workflowTypes.find(wt => wt._id === workflowTypeId);
			if (selectedWorkflowType) {
				prefix = selectedWorkflowType.prefix;
			}
		} else if (formData.workflowTypeId && workflowTypes.length > 0) {
			const selectedWorkflowType = workflowTypes.find(wt => wt._id === formData.workflowTypeId);
			if (selectedWorkflowType) {
				prefix = selectedWorkflowType.prefix;
			}
		}
		
		const timestamp = Date.now();
		const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
		setFormData(prev => ({ ...prev, caseId: `${prefix}-${randomNum}` }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		const attemptSubmission = async (attempts = 0): Promise<void> => {
			try {
				// Validate required fields
				if (!formData.caseId || !formData.clientId || !formData.assignedChampion || !formData.startDate) {
					setError('Please fill in all required fields');
					setLoading(false);
					return;
				}

				if (!currentUser?.id && !currentUser?._id) {
					setError('User authentication required. Please log in again.');
					setLoading(false);
					return;
				}

				const payload = {
					...formData,
					startDate: formData.startDate.toISOString(),
					expectedCompletionDate: formData.expectedCompletionDate?.toISOString() || null,
					createdBy: currentUser?.id || currentUser?._id
				};

				console.log('Creating onboarding case with payload:', payload);

				const response = await onboardingApi.create(payload);
				const data = await fetchJson(response);

				if (data.success) {
					onSuccess();
					onClose();
					// Reset form
					setFormData({
						caseId: '',
						workflowTypeId: '',
						clientId: '',
						assignedChampion: '',
						priority: 'Medium',
						startDate: new Date(),
						expectedCompletionDate: null,
						notes: ''
					});
					setRetryCount(0);
				} else {
					setError(data.error || 'Failed to create onboarding case');
				}
			} catch (error: any) {
				console.error('Error creating case:', error);
				
				// Check for duplicate key error and retry with new case ID (max 3 attempts)
				if (attempts < 3 && error.status === 400 && error.data?.error && error.data.error.includes('duplicate key error')) {
					console.log(`Duplicate case ID detected (attempt ${attempts + 1}), generating new one and retrying...`);
					generateCaseId();
					// Wait a bit and retry
					await new Promise(resolve => setTimeout(resolve, 100));
					return attemptSubmission(attempts + 1);
				}
				
				if (error.status === 400 && error.data?.error) {
					setError(error.data.error);
				} else {
					setError('Network error. Please try again.');
				}
			} finally {
				setLoading(false);
			}
		};

		await attemptSubmission();
	};

	const handleChange = (field: keyof FormData, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		
		// Regenerate case ID when workflow type changes
		if (field === 'workflowTypeId') {
			// Use setTimeout to ensure state is updated before generating new case ID
			setTimeout(() => {
				generateCaseId(value);
			}, 0);
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns}>
			<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
				<form onSubmit={handleSubmit}>
					<DialogTitle>Create New Onboarding Case</DialogTitle>
					<DialogContent>
						{error && (
							<Alert severity="error" className="mb-16">
								{error}
							</Alert>
						)}

						<Box className="space-y-16 mt-16">
							{/* Case ID and Priority */}
							<Box className="flex gap-16">
								<TextField
									label="Case ID"
									value={formData.caseId}
									onChange={(e) => handleChange('caseId', e.target.value)}
									required
									size="small"
									className="flex-1"
								/>
								<FormControl size="small" className="min-w-120" required>
									<InputLabel>Priority</InputLabel>
									<Select
										value={formData.priority}
										onChange={(e) => handleChange('priority', e.target.value)}
										label="Priority"
									>
										<MenuItem value="Low">Low</MenuItem>
										<MenuItem value="Medium">Medium</MenuItem>
										<MenuItem value="High">High</MenuItem>
										<MenuItem value="Critical">Critical</MenuItem>
									</Select>
								</FormControl>
							</Box>

							{/* Workflow Type */}
							<FormControl fullWidth size="small" required>
								<InputLabel>Workflow Type</InputLabel>
								<Select
									value={formData.workflowTypeId}
									onChange={(e) => handleChange('workflowTypeId', e.target.value)}
									label="Workflow Type"
								>
									{workflowTypes.map((workflowType) => (
										<MenuItem key={workflowType._id} value={workflowType._id}>
											{workflowType.name} - {workflowType.prefix}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Client */}
							<FormControl fullWidth size="small" required>
								<InputLabel>Client</InputLabel>
								<Select
									value={formData.clientId}
									onChange={(e) => handleChange('clientId', e.target.value)}
									label="Client"
								>
									{clients.map((client) => (
										<MenuItem key={client._id} value={client._id}>
											{client.name} - {client.email}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Assigned Champion */}
							<FormControl fullWidth size="small" required>
								<InputLabel>Assigned Champion</InputLabel>
								<Select
									value={formData.assignedChampion}
									onChange={(e) => handleChange('assignedChampion', e.target.value)}
									label="Assigned Champion"
								>
									{champions.map((champion) => (
										<MenuItem key={champion.id} value={champion.id}>
											{champion.firstName} {champion.lastName} ({champion.role})
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Dates */}
							<Box className="flex gap-16">
								<DatePicker
									label="Start Date"
									value={formData.startDate}
									onChange={(date) => handleChange('startDate', date)}
									slotProps={{
										textField: {
											size: 'small',
											className: 'flex-1',
											required: true
										},
										popper: {
											sx: {
												zIndex: 9999
											}
										}
									}}
								/>
								<DatePicker
									label="Expected Completion"
									value={formData.expectedCompletionDate}
									onChange={(date) => handleChange('expectedCompletionDate', date)}
									slotProps={{
										textField: {
											size: 'small',
											className: 'flex-1'
										},
										popper: {
											sx: {
												zIndex: 9999
											}
										}
									}}
								/>
							</Box>

							{/* Notes */}
							<TextField
								label="Notes"
								value={formData.notes}
								onChange={(e) => handleChange('notes', e.target.value)}
								multiline
								rows={2}
								fullWidth
								size="small"
							/>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button 
							type="submit" 
							variant="contained" 
							disabled={loading}
							startIcon={loading ? <CircularProgress size={16} /> : null}
						>
							{loading ? 'Creating...' : 'Create Case'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</LocalizationProvider>
	);
}

export default NewCaseDialog;
