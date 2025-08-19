import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	MenuItem,
	FormControl,
	InputLabel,
	Select,
	Typography,
	Box,
	Chip,
	Stack
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { clientApi } from '@/utils/authFetch';

interface NewClientDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

function NewClientDialog({ open, onClose, onSuccess }: NewClientDialogProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		contactInfo: {
			email: '',
			phone: '',
			primaryContact: '',
			secondaryContact: '',
			address: {
				street: '',
				city: '',
				state: '',
				zipCode: '',
				country: 'USA'
			}
		},
		location: '',
		practiceDetails: {
			practiceType: '',
			numberOfProviders: '',
			specialties: [] as string[],
			establishedDate: '',
			licenseNumber: ''
		},
		industryType: 'Dental',
		status: 'Prospect',
		priority: 'Medium',
		notes: ''
	});
	const [newSpecialty, setNewSpecialty] = useState('');

	const handleInputChange = (path: string, value: any) => {
		setFormData((prev) => {
			const keys = path.split('.');
			const updated = { ...prev };
			let current = updated as any;

			for (let i = 0; i < keys.length - 1; i++) {
				current[keys[i]] = { ...current[keys[i]] };
				current = current[keys[i]];
			}

			current[keys[keys.length - 1]] = value;
			return updated;
		});
	};

	const addSpecialty = () => {
		if (newSpecialty.trim() && !formData.practiceDetails.specialties.includes(newSpecialty.trim())) {
			setFormData((prev) => ({
				...prev,
				practiceDetails: {
					...prev.practiceDetails,
					specialties: [...prev.practiceDetails.specialties, newSpecialty.trim()]
				}
			}));
			setNewSpecialty('');
		}
	};

	const removeSpecialty = (specialty: string) => {
		setFormData((prev) => ({
			...prev,
			practiceDetails: {
				...prev.practiceDetails,
				specialties: prev.practiceDetails.specialties.filter((s) => s !== specialty)
			}
		}));
	};

	const handleSubmit = async () => {
		try {
			setLoading(true);

			// Prepare data for API
			const submitData = {
				...formData,
				practiceDetails: {
					...formData.practiceDetails,
					numberOfProviders: formData.practiceDetails.numberOfProviders
						? parseInt(formData.practiceDetails.numberOfProviders)
						: undefined,
					establishedDate: formData.practiceDetails.establishedDate
						? new Date(formData.practiceDetails.establishedDate).toISOString()
						: undefined
				}
			};

			const response = await clientApi.create(submitData);

			// Check if response is ok
			if (response.ok) {
				onSuccess();
				onClose();
				// Reset form
				setFormData({
					name: '',
					contactInfo: {
						email: '',
						phone: '',
						primaryContact: '',
						secondaryContact: '',
						address: {
							street: '',
							city: '',
							state: '',
							zipCode: '',
							country: 'USA'
						}
					},
					location: '',
					practiceDetails: {
						practiceType: '',
						numberOfProviders: '',
						specialties: [],
						establishedDate: '',
						licenseNumber: ''
					},
					industryType: 'Dental',
					status: 'Prospect',
					priority: 'Medium',
					notes: ''
				});
			} else {
				console.error('Failed to create client');
			}
		} catch (error) {
			console.error('Error creating client:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
		>
			<DialogTitle>Create New Client</DialogTitle>
			<DialogContent>
				<Stack
					spacing={2}
					sx={{ mt: 1 }}
				>
					{/* Basic Information */}
					<Typography variant="h6">Basic Information</Typography>
					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="Client Name"
							value={formData.name}
							onChange={(e) => handleInputChange('name', e.target.value)}
							required
							size="small"
						/>
						<TextField
							fullWidth
							label="Location"
							value={formData.location}
							onChange={(e) => handleInputChange('location', e.target.value)}
							required
							size="small"
						/>
					</Box>

					{/* Contact Information */}
					<Typography
						variant="h6"
						sx={{ mt: 2 }}
					>
						Contact Information
					</Typography>
					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="Email"
							type="email"
							value={formData.contactInfo.email}
							onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
							required
							size="small"
						/>
						<TextField
							fullWidth
							label="Phone"
							value={formData.contactInfo.phone}
							onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
							required
							size="small"
						/>
					</Box>

					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="Primary Contact"
							value={formData.contactInfo.primaryContact}
							onChange={(e) => handleInputChange('contactInfo.primaryContact', e.target.value)}
							size="small"
						/>
						<TextField
							fullWidth
							label="Secondary Contact"
							value={formData.contactInfo.secondaryContact}
							onChange={(e) => handleInputChange('contactInfo.secondaryContact', e.target.value)}
							size="small"
						/>
					</Box>

					{/* Address */}
					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="Street Address"
							value={formData.contactInfo.address.street}
							onChange={(e) => handleInputChange('contactInfo.address.street', e.target.value)}
							size="small"
						/>
						<TextField
							fullWidth
							label="City"
							value={formData.contactInfo.address.city}
							onChange={(e) => handleInputChange('contactInfo.address.city', e.target.value)}
							size="small"
						/>
					</Box>

					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="State"
							value={formData.contactInfo.address.state}
							onChange={(e) => handleInputChange('contactInfo.address.state', e.target.value)}
							size="small"
						/>
						<TextField
							fullWidth
							label="Zip Code"
							value={formData.contactInfo.address.zipCode}
							onChange={(e) => handleInputChange('contactInfo.address.zipCode', e.target.value)}
							size="small"
						/>
						<TextField
							fullWidth
							label="Country"
							value={formData.contactInfo.address.country}
							onChange={(e) => handleInputChange('contactInfo.address.country', e.target.value)}
							size="small"
						/>
					</Box>

					{/* Practice Details */}
					<Typography
						variant="h6"
						sx={{ mt: 2 }}
					>
						Practice Details
					</Typography>
					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="Practice Type"
							value={formData.practiceDetails.practiceType}
							onChange={(e) => handleInputChange('practiceDetails.practiceType', e.target.value)}
							size="small"
						/>
						<TextField
							fullWidth
							label="Number of Providers"
							type="number"
							value={formData.practiceDetails.numberOfProviders}
							onChange={(e) => handleInputChange('practiceDetails.numberOfProviders', e.target.value)}
							size="small"
						/>
					</Box>

					<Box className="flex gap-2">
						<TextField
							fullWidth
							label="Established Date"
							type="date"
							value={formData.practiceDetails.establishedDate}
							onChange={(e) => handleInputChange('practiceDetails.establishedDate', e.target.value)}
							InputLabelProps={{ shrink: true }}
							size="small"
						/>
						<TextField
							fullWidth
							label="License Number"
							value={formData.practiceDetails.licenseNumber}
							onChange={(e) => handleInputChange('practiceDetails.licenseNumber', e.target.value)}
							size="small"
						/>
					</Box>

					{/* Specialties */}
					<Box>
						<Box className="flex items-center gap-2 mb-2">
							<TextField
								label="Add Specialty"
								value={newSpecialty}
								onChange={(e) => setNewSpecialty(e.target.value)}
								size="small"
								onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
							/>
							<Button
								onClick={addSpecialty}
								variant="outlined"
								size="small"
								startIcon={<AddIcon />}
							>
								Add
							</Button>
						</Box>
						<Box className="flex flex-wrap gap-1">
							{formData.practiceDetails.specialties.map((specialty) => (
								<Chip
									key={specialty}
									label={specialty}
									onDelete={() => removeSpecialty(specialty)}
									size="small"
								/>
							))}
						</Box>
					</Box>

					{/* Client Classification */}
					<Typography
						variant="h6"
						sx={{ mt: 2 }}
					>
						Classification
					</Typography>
					<Box className="flex gap-2">
						<FormControl
							fullWidth
							size="small"
						>
							<InputLabel>Industry Type</InputLabel>
							<Select
								value={formData.industryType}
								onChange={(e) => handleInputChange('industryType', e.target.value)}
								label="Industry Type"
							>
								<MenuItem value="Dental">Dental</MenuItem>
								<MenuItem value="Medical">Medical</MenuItem>
								<MenuItem value="Veterinary">Veterinary</MenuItem>
								<MenuItem value="Other">Other</MenuItem>
							</Select>
						</FormControl>

						<FormControl
							fullWidth
							size="small"
						>
							<InputLabel>Status</InputLabel>
							<Select
								value={formData.status}
								onChange={(e) => handleInputChange('status', e.target.value)}
								label="Status"
							>
								<MenuItem value="Prospect">Prospect</MenuItem>
								<MenuItem value="Active">Active</MenuItem>
								<MenuItem value="Inactive">Inactive</MenuItem>
								<MenuItem value="Churned">Churned</MenuItem>
							</Select>
						</FormControl>

						<FormControl
							fullWidth
							size="small"
						>
							<InputLabel>Priority</InputLabel>
							<Select
								value={formData.priority}
								onChange={(e) => handleInputChange('priority', e.target.value)}
								label="Priority"
							>
								<MenuItem value="Low">Low</MenuItem>
								<MenuItem value="Medium">Medium</MenuItem>
								<MenuItem value="High">High</MenuItem>
								<MenuItem value="Critical">Critical</MenuItem>
							</Select>
						</FormControl>
					</Box>

					{/* Notes */}
					<TextField
						fullWidth
						label="Notes"
						multiline
						rows={3}
						value={formData.notes}
						onChange={(e) => handleInputChange('notes', e.target.value)}
						size="small"
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={
						loading ||
						!formData.name ||
						!formData.contactInfo.email ||
						!formData.contactInfo.phone ||
						!formData.location
					}
				>
					{loading ? 'Creating...' : 'Create Client'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default NewClientDialog;
