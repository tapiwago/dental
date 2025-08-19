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
	Chip
} from '@mui/material';
import { stageApi, taskApi, userApi, fetchJson } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface AddTaskDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	caseId: string;
	stageId?: string;
}

interface Stage {
	_id: string;
	name: string;
	sequence: number;
}

interface User {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
}

function AddTaskDialog({ open, onClose, onSuccess, caseId, stageId }: AddTaskDialogProps) {
	const { data: user } = useUser();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Form fields
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [selectedStageId, setSelectedStageId] = useState(stageId || '');
	const [priority, setPriority] = useState('Medium');
	const [estimatedHours, setEstimatedHours] = useState('');
	const [assignedTo, setAssignedTo] = useState('');
	const [isRequired, setIsRequired] = useState(false);
	const [dueDate, setDueDate] = useState('');

	// Data
	const [stages, setStages] = useState<Stage[]>([]);
	const [users, setUsers] = useState<User[]>([]);

	useEffect(() => {
		if (open) {
			fetchStages();
			fetchUsers();
		}
	}, [open, caseId]);

	const fetchStages = async () => {
		try {
			const params = new URLSearchParams();
			params.append('onboardingCaseId', caseId);
			const response = await stageApi.getAll(params);
			const data = await fetchJson(response);

			if (Array.isArray(data)) {
				setStages(data);
			} else if (data.stages) {
				setStages(data.stages);
			}
		} catch (error) {
			console.error('Error fetching stages:', error);
		}
	};

	const fetchUsers = async () => {
		try {
			const response = await userApi.getAll();
			const data = await fetchJson(response);

			if (Array.isArray(data)) {
				setUsers(data);
			} else if (data.users) {
				setUsers(data.users);
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	};

	const validateForm = () => {
		if (!name.trim()) {
			setError('Task name is required');
			return false;
		}

		if (!selectedStageId) {
			setError('Stage selection is required');
			return false;
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

			const taskData = {
				taskId: `${caseId}-TSK-${Date.now()}`,
				name: name.trim(),
				description: description.trim() || undefined,
				stageId: selectedStageId,
				onboardingCaseId: caseId,
				priority,
				estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
				isRequired,
				assignedTo: assignedTo ? [assignedTo] : [user.id], // Assign to selected user or current user
				dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
				createdBy: user.id
			};

			const response = await taskApi.create(taskData);
			const data = await fetchJson(response);

			if (data._id || data.success) {
				onSuccess();
				onClose();
				// Reset form
				setName('');
				setDescription('');
				setSelectedStageId(stageId || '');
				setPriority('Medium');
				setEstimatedHours('');
				setAssignedTo('');
				setIsRequired(false);
				setDueDate('');
			} else {
				setError(data.error || 'Failed to create task');
			}
		} catch (error: any) {
			console.error('Error creating task:', error);
			setError('Failed to create task. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setError('');
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
		>
			<DialogTitle>Add New Task</DialogTitle>
			<DialogContent>
				<Typography
					variant="body2"
					color="text.secondary"
					className="mb-16"
				>
					Add a new task to the onboarding case.
				</Typography>

				{error && (
					<Alert
						severity="error"
						className="mb-16"
					>
						{error}
					</Alert>
				)}

				<Box className="space-y-16">
					<TextField
						label="Task Name"
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
						<FormControl
							fullWidth
							required
						>
							<InputLabel>Stage</InputLabel>
							<Select
								value={selectedStageId}
								onChange={(e) => setSelectedStageId(e.target.value)}
								label="Stage"
							>
								{stages.map((stage) => (
									<MenuItem
										key={stage._id}
										value={stage._id}
									>
										{stage.sequence}. {stage.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel>Priority</InputLabel>
							<Select
								value={priority}
								onChange={(e) => setPriority(e.target.value)}
								label="Priority"
							>
								<MenuItem value="Low">Low</MenuItem>
								<MenuItem value="Medium">Medium</MenuItem>
								<MenuItem value="High">High</MenuItem>
								<MenuItem value="Critical">Critical</MenuItem>
							</Select>
						</FormControl>
					</Box>

					<Box className="grid grid-cols-2 gap-16">
						<TextField
							label="Estimated Hours"
							value={estimatedHours}
							onChange={(e) => setEstimatedHours(e.target.value)}
							type="number"
							helperText="Expected time to complete"
						/>

						<TextField
							label="Due Date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							type="date"
							InputLabelProps={{ shrink: true }}
						/>
					</Box>

					<FormControl fullWidth>
						<InputLabel>Assign To</InputLabel>
						<Select
							value={assignedTo}
							onChange={(e) => setAssignedTo(e.target.value)}
							label="Assign To"
						>
							<MenuItem value="">
								<em>Assign to current user (champion)</em>
							</MenuItem>
							{users.map((u) => (
								<MenuItem
									key={u._id}
									value={u._id}
								>
									{u.firstName} {u.lastName} ({u.email})
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Box>
						<FormControlLabel
							control={
								<Switch
									checked={isRequired}
									onChange={(e) => setIsRequired(e.target.checked)}
								/>
							}
							label="Required Task"
						/>
						<Typography
							variant="caption"
							color="text.secondary"
							className="block mt-4"
						>
							Whether this task must be completed to proceed
						</Typography>
					</Box>

					<Box>
						<Typography
							variant="body2"
							className="mb-8"
						>
							Priority Information:
						</Typography>
						<Box className="flex gap-8">
							<Chip
								label="Low"
								color="success"
								size="small"
							/>
							<Chip
								label="Medium"
								color="info"
								size="small"
							/>
							<Chip
								label="High"
								color="warning"
								size="small"
							/>
							<Chip
								label="Critical"
								color="error"
								size="small"
							/>
						</Box>
					</Box>
				</Box>
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
					disabled={loading}
				>
					{loading ? 'Creating...' : 'Create Task'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default AddTaskDialog;
