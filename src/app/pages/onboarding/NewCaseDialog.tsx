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

interface Client {
	_id: string;
	name: string;
	email: string;
}

interface User {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
}

interface NewCaseDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface FormData {
	caseId: string;
	clientId: string;
	assignedChampion: string;
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	startDate: Date;
	expectedCompletionDate: Date | null;
	notes: string;
}

function NewCaseDialog({ open, onClose, onSuccess }: NewCaseDialogProps) {
	const [formData, setFormData] = useState<FormData>({
		caseId: '',
		clientId: '',
		assignedChampion: '',
		priority: 'Medium',
		startDate: new Date(),
		expectedCompletionDate: null,
		notes: ''
	});

	const [clients, setClients] = useState<Client[]>([]);
	const [champions, setChampions] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (open) {
			fetchClients();
			fetchChampions();
			generateCaseId();
		}
	}, [open]);

	const fetchClients = async () => {
		try {
			const response = await fetch('http://localhost:5000/api/clients');
			const data = await response.json();
			if (data.success) {
				setClients(data.data);
			}
		} catch (error) {
			console.error('Error fetching clients:', error);
		}
	};

	const fetchChampions = async () => {
		try {
			const response = await fetch('http://localhost:5000/api/users?role=Champion,Senior Champion,Admin');
			const data = await response.json();
			if (data.success) {
				setChampions(data.data);
			}
		} catch (error) {
			console.error('Error fetching champions:', error);
		}
	};

	const generateCaseId = () => {
		const timestamp = Date.now().toString().slice(-6);
		const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
		setFormData(prev => ({ ...prev, caseId: `OB-${timestamp}-${randomNum}` }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const payload = {
				...formData,
				startDate: formData.startDate.toISOString(),
				expectedCompletionDate: formData.expectedCompletionDate?.toISOString() || null
			};

			const response = await fetch('http://localhost:5000/api/onboarding-cases', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			});

			const data = await response.json();

			if (data.success) {
				onSuccess();
				onClose();
				// Reset form
				setFormData({
					caseId: '',
					clientId: '',
					assignedChampion: '',
					priority: 'Medium',
					startDate: new Date(),
					expectedCompletionDate: null,
					notes: ''
				});
			} else {
				setError(data.error || 'Failed to create onboarding case');
			}
		} catch (error) {
			setError('Network error. Please try again.');
			console.error('Error creating case:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (field: keyof FormData, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
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
										<MenuItem key={champion._id} value={champion._id}>
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
