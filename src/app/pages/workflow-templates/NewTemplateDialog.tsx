import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Box,
	Typography,
	Chip,
	FormControlLabel,
	Switch,
	Autocomplete
} from '@mui/material';
import { templateApi, fetchJson, userApi } from '@/utils/authFetch';
import useUser from '@/@auth/useUser';

interface NewTemplateDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface User {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
}

function NewTemplateDialog({ open, onClose, onSuccess }: NewTemplateDialogProps) {
	const { data: user } = useUser();
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Debug logging
	console.log('NewTemplateDialog rendered with open:', open, 'user:', user);

	// Form fields
	const [templateId, setTemplateId] = useState('');
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [type, setType] = useState('');
	const [industryType, setIndustryType] = useState('General');
	const [clientSize, setClientSize] = useState('Medium');
	const [complexity, setComplexity] = useState('Standard');
	const [estimatedDuration, setEstimatedDuration] = useState('');
	const [estimatedCost, setEstimatedCost] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [isDefault, setIsDefault] = useState(false);
	const [tagInput, setTagInput] = useState('');
	const [categoryInput, setCategoryInput] = useState('');

	useEffect(() => {
		if (open) {
			// Reset form when dialog opens
			setTemplateId('');
			setName('');
			setDescription('');
			setType('');
			setIndustryType('General');
			setClientSize('Medium');
			setComplexity('Standard');
			setEstimatedDuration('');
			setEstimatedCost('');
			setTags([]);
			setCategories([]);
			setIsDefault(false);
			setTagInput('');
			setCategoryInput('');
			setErrors({});
		}
	}, [open]);

	// Generate template ID based on name and type
	useEffect(() => {
		if (name && type) {
			const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
			const typePrefix = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
			setTemplateId(`${typePrefix}_${sanitized}_${Date.now()}`);
		}
	}, [name, type]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = 'Name is required';
		}
		if (!type) {
			newErrors.type = 'Type is required';
		}
		if (!templateId.trim()) {
			newErrors.templateId = 'Template ID is required';
		}
		if (!user?.id && !user?._id) {
			newErrors.user = 'User information not available';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) return;

		// Ensure user is available
		if (!user?.id && !user?._id) {
			setErrors({ submit: 'User information not available. Please refresh and try again.' });
			return;
		}

		try {
			setLoading(true);
			setErrors({});

			const templateData = {
				templateId,
				name: name.trim(),
				description: description.trim() || undefined,
				type,
				industryType,
				clientSize,
				complexity,
				estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
				estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
				tags: tags.filter(tag => tag.trim()),
				categories: categories.filter(cat => cat.trim()),
				isDefault,
				createdBy: user?.id || user?._id,
				configuration: {
					defaultStages: [],
					defaultSteps: [],
					defaultSettings: {}
				}
			};

			console.log('Creating template with data:', templateData);
			console.log('User ID:', user?.id || user?._id);

			const response = await templateApi.create(templateData);
			
			// Check if response is ok before parsing JSON
			if (!response.ok) {
				const errorData = await response.json();
				console.error('Template creation error response:', errorData);
				throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await fetchJson(response);
			console.log('Template creation response:', data);

			if (data._id) {
				onSuccess();
				onClose();
			} else {
				setErrors({ submit: data.error || data.message || 'Failed to create template' });
			}
		} catch (error: any) {
			console.error('Error creating template:', error);
			// Extract error message from various possible error formats
			let errorMessage = 'Failed to create template. Please try again.';
			if (error.message) {
				errorMessage = error.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}
			setErrors({ submit: errorMessage });
		} finally {
			setLoading(false);
		}
	};

	const handleAddTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim())) {
			setTags([...tags, tagInput.trim()]);
			setTagInput('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter(tag => tag !== tagToRemove));
	};

	const handleAddCategory = () => {
		if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
			setCategories([...categories, categoryInput.trim()]);
			setCategoryInput('');
		}
	};

	const handleRemoveCategory = (categoryToRemove: string) => {
		setCategories(categories.filter(cat => cat !== categoryToRemove));
	};

	const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			action();
		}
	};

	return (
		<Dialog 
			open={open} 
			onClose={onClose} 
			maxWidth="md" 
			fullWidth
			PaperProps={{
				style: { minHeight: '600px' }
			}}
		>
			<DialogTitle>Create New Template</DialogTitle>
			<DialogContent>
				{(!user?.id && !user?._id) && (
					<Typography color="error" className="mb-16">
						User data not loaded. Please refresh the page.
					</Typography>
				)}
				
				<Box className="space-y-16 pt-8">
					{/* Basic Information */}
					<Box>
						<Typography variant="h6" className="mb-12">Basic Information</Typography>
						<Box className="grid grid-cols-1 md:grid-cols-2 gap-16">
							<TextField
								label="Template Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								error={!!errors.name}
								helperText={errors.name}
								fullWidth
								required
							/>
							<FormControl fullWidth required error={!!errors.type}>
								<InputLabel>Type</InputLabel>
								<Select
									value={type}
									onChange={(e) => setType(e.target.value)}
									label="Type"
								>
									<MenuItem value="OnboardingCase">Onboarding Case</MenuItem>
									<MenuItem value="Stage">Stage</MenuItem>
									<MenuItem value="Task">Task</MenuItem>
									<MenuItem value="WorkflowGuide">Workflow Guide</MenuItem>
								</Select>
								{errors.type && (
									<Typography variant="caption" color="error" className="mt-4">
										{errors.type}
									</Typography>
								)}
							</FormControl>
						</Box>
						<TextField
							label="Template ID"
							value={templateId}
							onChange={(e) => setTemplateId(e.target.value)}
							error={!!errors.templateId}
							helperText={errors.templateId || 'Auto-generated from name and type'}
							fullWidth
							className="mt-16"
							required
						/>
						<TextField
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							multiline
							rows={3}
							fullWidth
							className="mt-16"
						/>
					</Box>

					{/* Classification */}
					<Box>
						<Typography variant="h6" className="mb-12">Classification</Typography>
						<Box className="grid grid-cols-1 md:grid-cols-3 gap-16">
							<FormControl fullWidth>
								<InputLabel>Industry Type</InputLabel>
								<Select
									value={industryType}
									onChange={(e) => setIndustryType(e.target.value)}
									label="Industry Type"
								>
									<MenuItem value="Dental">Dental</MenuItem>
									<MenuItem value="Medical">Medical</MenuItem>
									<MenuItem value="Veterinary">Veterinary</MenuItem>
									<MenuItem value="General">General</MenuItem>
								</Select>
							</FormControl>
							<FormControl fullWidth>
								<InputLabel>Client Size</InputLabel>
								<Select
									value={clientSize}
									onChange={(e) => setClientSize(e.target.value)}
									label="Client Size"
								>
									<MenuItem value="Small">Small</MenuItem>
									<MenuItem value="Medium">Medium</MenuItem>
									<MenuItem value="Large">Large</MenuItem>
									<MenuItem value="Enterprise">Enterprise</MenuItem>
								</Select>
							</FormControl>
							<FormControl fullWidth>
								<InputLabel>Complexity</InputLabel>
								<Select
									value={complexity}
									onChange={(e) => setComplexity(e.target.value)}
									label="Complexity"
								>
									<MenuItem value="Simple">Simple</MenuItem>
									<MenuItem value="Standard">Standard</MenuItem>
									<MenuItem value="Complex">Complex</MenuItem>
									<MenuItem value="Enterprise">Enterprise</MenuItem>
								</Select>
							</FormControl>
						</Box>
					</Box>

					{/* Estimates */}
					<Box>
						<Typography variant="h6" className="mb-12">Estimates</Typography>
						<Box className="grid grid-cols-1 md:grid-cols-2 gap-16">
							<TextField
								label="Estimated Duration (days)"
								type="number"
								value={estimatedDuration}
								onChange={(e) => setEstimatedDuration(e.target.value)}
								fullWidth
							/>
							<TextField
								label="Estimated Cost ($)"
								type="number"
								value={estimatedCost}
								onChange={(e) => setEstimatedCost(e.target.value)}
								fullWidth
							/>
						</Box>
					</Box>

					{/* Tags */}
					<Box>
						<Typography variant="h6" className="mb-12">Tags</Typography>
						<Box className="flex gap-8 mb-8">
							<TextField
								label="Add Tag"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
								size="small"
								className="flex-1"
							/>
							<Button onClick={handleAddTag} variant="outlined" size="small">
								Add
							</Button>
						</Box>
						<Box className="flex flex-wrap gap-8">
							{tags.map((tag, index) => (
								<Chip
									key={index}
									label={tag}
									onDelete={() => handleRemoveTag(tag)}
									size="small"
									color="primary"
									variant="outlined"
								/>
							))}
						</Box>
					</Box>

					{/* Categories */}
					<Box>
						<Typography variant="h6" className="mb-12">Categories</Typography>
						<Box className="flex gap-8 mb-8">
							<TextField
								label="Add Category"
								value={categoryInput}
								onChange={(e) => setCategoryInput(e.target.value)}
								onKeyPress={(e) => handleKeyPress(e, handleAddCategory)}
								size="small"
								className="flex-1"
							/>
							<Button onClick={handleAddCategory} variant="outlined" size="small">
								Add
							</Button>
						</Box>
						<Box className="flex flex-wrap gap-8">
							{categories.map((category, index) => (
								<Chip
									key={index}
									label={category}
									onDelete={() => handleRemoveCategory(category)}
									size="small"
									color="secondary"
									variant="outlined"
								/>
							))}
						</Box>
					</Box>

					{/* Options */}
					<Box>
						<Typography variant="h6" className="mb-12">Options</Typography>
						<FormControlLabel
							control={
								<Switch
									checked={isDefault}
									onChange={(e) => setIsDefault(e.target.checked)}
								/>
							}
							label="Set as default template for this type"
						/>
					</Box>

					{errors.submit && (
						<Typography color="error" variant="body2">
							{errors.submit}
						</Typography>
					)}
					
					{errors.user && (
						<Typography color="error" variant="body2">
							{errors.user}
						</Typography>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					Cancel
				</Button>
				<Button 
					onClick={handleSubmit} 
					variant="contained" 
					disabled={loading || (!user?.id && !user?._id)}
				>
					{loading ? 'Creating...' : 'Create Template'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default NewTemplateDialog;
