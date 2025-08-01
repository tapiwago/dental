import React, { useState } from 'react';
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
	Switch
} from '@mui/material';
import { stageApi, taskApi, fetchJson } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface AddStageDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	caseId: string;
}

function AddStageDialog({ open, onClose, onSuccess, caseId }: AddStageDialogProps) {
	const { data: user } = useUser();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	
	// Form fields
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [sequence, setSequence] = useState('');
	const [estimatedDuration, setEstimatedDuration] = useState('');
	const [isRequired, setIsRequired] = useState(true);

	const validateForm = () => {
		if (!name.trim()) {
			setError('Stage name is required');
			return false;
		}
		if (!sequence.trim() || isNaN(Number(sequence))) {
			setError('Valid sequence number is required');
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

			const stageData = {
				stageId: `${caseId}-STG-${Date.now()}`,
				name: name.trim(),
				description: description.trim() || undefined,
				sequence: parseInt(sequence),
				onboardingCaseId: caseId,
				championId: user.id, // Assign current user as champion
				estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
				isRequired,
				createdBy: user.id
			};

			const response = await stageApi.create(stageData);
			const data = await fetchJson(response);

			if (data._id) {
				onSuccess();
				onClose();
				// Reset form
				setName('');
				setDescription('');
				setSequence('');
				setEstimatedDuration('');
				setIsRequired(true);
			} else {
				setError(data.error || 'Failed to create stage');
			}
		} catch (error: any) {
			console.error('Error creating stage:', error);
			setError('Failed to create stage. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setError('');
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Add New Stage</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary" className="mb-16">
					Add a new stage to the onboarding case.
				</Typography>

				{error && (
					<Alert severity="error" className="mb-16">
						{error}
					</Alert>
				)}

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
						<Typography variant="caption" color="text.secondary" className="block mt-4">
							Whether this stage must be completed
						</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={loading}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={loading}
				>
					{loading ? 'Creating...' : 'Create Stage'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default AddStageDialog;
