import React, { useState, useEffect } from 'react';
import {
	Typography,
	Box,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	CircularProgress,
	Alert,
	Chip,
	FormControlLabel,
	Switch,
	Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useParams } from 'react-router';
import useNavigate from '@fuse/hooks/useNavigate';
import { templateApi, fetchJson } from '@/utils/authFetch';
import useUser from '@auth/useUser';
import { useAppDispatch } from '@/store/hooks';
import { showMessage } from '@fuse/core/FuseMessage/fuseMessageSlice';

interface Template {
	_id: string;
	templateId: string;
	name: string;
	description?: string;
	type: 'OnboardingCase' | 'Stage' | 'Task' | 'WorkflowGuide';
	industryType: 'Dental' | 'Medical' | 'Veterinary' | 'General';
	clientSize: 'Small' | 'Medium' | 'Large' | 'Enterprise';
	complexity: 'Simple' | 'Standard' | 'Complex' | 'Enterprise';
	status: 'Draft' | 'Published' | 'Deprecated' | 'Archived';
	version: string;
	isDefault: boolean;
	estimatedDuration?: number;
	estimatedCost?: number;
	tags: string[];
	categories: string[];
}

function TemplateEdit() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { data: user } = useUser();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Form fields
	const [templateId, setTemplateId] = useState('');
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [type, setType] = useState('');
	const [industryType, setIndustryType] = useState('General');
	const [clientSize, setClientSize] = useState('Medium');
	const [complexity, setComplexity] = useState('Standard');
	const [status, setStatus] = useState('Draft');
	const [version, setVersion] = useState('1.0');
	const [estimatedDuration, setEstimatedDuration] = useState('');
	const [estimatedCost, setEstimatedCost] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [isDefault, setIsDefault] = useState(false);
	const [tagInput, setTagInput] = useState('');
	const [categoryInput, setCategoryInput] = useState('');

	useEffect(() => {
		if (id) {
			fetchTemplateDetails();
		}
	}, [id]);

	const fetchTemplateDetails = async () => {
		try {
			setLoading(true);
			setError('');
			const response = await templateApi.getById(id);
			const data = await fetchJson(response);

			if (data._id) {
				// Populate form fields
				setTemplateId(data.templateId || '');
				setName(data.name || '');
				setDescription(data.description || '');
				setType(data.type || '');
				setIndustryType(data.industryType || 'General');
				setClientSize(data.clientSize || 'Medium');
				setComplexity(data.complexity || 'Standard');
				setStatus(data.status || 'Draft');
				setVersion(data.version || '1.0');
				setEstimatedDuration(data.estimatedDuration?.toString() || '');
				setEstimatedCost(data.estimatedCost?.toString() || '');
				setTags(data.tags || []);
				setCategories(data.categories || []);
				setIsDefault(data.isDefault || false);
			} else {
				setError(data.error || 'Failed to load template details');
			}
		} catch (error: any) {
			console.error('Error fetching template details:', error);
			setError('Failed to load template details. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!type) {
			newErrors.type = 'Type is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const clearFieldError = (fieldName: string) => {
		if (errors[fieldName]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[fieldName];
				return newErrors;
			});
		}
	};

	const handleSave = async () => {
		if (!validateForm()) {
			// Get specific validation errors to show in the message
			const errorFields = [];

			if (!name.trim()) errorFields.push('Template Name');

			if (!type) errorFields.push('Type');

			const errorMessage =
				errorFields.length > 0
					? `Please fix the following fields: ${errorFields.join(', ')}`
					: 'Please fill in all required fields';

			dispatch(
				showMessage({
					message: errorMessage,
					variant: 'error'
				})
			);
			return;
		}

		try {
			setSaving(true);
			setErrors({});

			const templateData = {
				templateId,
				name: name.trim(),
				description: description.trim() || undefined,
				type,
				industryType,
				clientSize,
				complexity,
				status,
				version,
				estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
				estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
				tags: tags.filter((tag) => tag.trim()),
				categories: categories.filter((cat) => cat.trim()),
				isDefault,
				// Only include lastModifiedBy if user is available
				...(user?._id && { lastModifiedBy: user._id })
			};

			const response = await templateApi.update(id!, templateData);
			const data = await fetchJson(response);

			if (data._id) {
				dispatch(
					showMessage({
						message: 'Template updated successfully!',
						variant: 'success'
					})
				);
				navigate(`/workflow-templates/template/${id}`);
			} else {
				dispatch(
					showMessage({
						message: data.error || 'Failed to update template',
						variant: 'error'
					})
				);
				setErrors({ submit: data.error || 'Failed to update template' });
			}
		} catch (error: any) {
			console.error('Error updating template:', error);
			const errorMessage = error.data?.error || error.message || 'Failed to update template. Please try again.';
			dispatch(
				showMessage({
					message: errorMessage,
					variant: 'error'
				})
			);
			setErrors({ submit: errorMessage });
		} finally {
			setSaving(false);
		}
	};

	const handleBack = () => {
		navigate(`/workflow-templates/template/${id}`);
	};

	const handleAddTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim())) {
			setTags([...tags, tagInput.trim()]);
			setTagInput('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	const handleAddCategory = () => {
		if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
			setCategories([...categories, categoryInput.trim()]);
			setCategoryInput('');
		}
	};

	const handleRemoveCategory = (categoryToRemove: string) => {
		setCategories(categories.filter((cat) => cat !== categoryToRemove));
	};

	const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			action();
		}
	};

	if (loading) {
		return (
			<Box className="flex justify-center items-center min-h-400">
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box className="p-24">
				<Alert
					severity="error"
					className="mb-16"
				>
					{error}
				</Alert>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/workflow-templates')}
				>
					Back to Templates
				</Button>
			</Box>
		);
	}

	return (
		<div className="w-full p-5">
			{/* Header */}
			<Box className="mb-5">
				<Box className="flex items-center justify-between">
					<div>
						<Typography
							variant="h4"
							className="font-bold"
						>
							Edit Template: {name}
						</Typography>
						<Typography
							variant="body1"
							color="text.secondary"
						>
							Template ID: {templateId}
						</Typography>
					</div>
					<Box className="flex gap-4">
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={handleBack}
						>
							Back to Template
						</Button>
						<Button
							variant="contained"
							startIcon={<SaveIcon />}
							onClick={handleSave}
							disabled={saving}
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</Button>
					</Box>
				</Box>
			</Box>

			<Divider className="mb-5" />
			{/* Basic Information */}
			<Box className="mb-5">
				<Typography
					variant="h6"
					className="mb-5"
				>
					Basic Information
				</Typography>
				<Box className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
					<TextField
						label="Template Name"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							clearFieldError('name');
						}}
						error={!!errors.name}
						helperText={errors.name}
						fullWidth
						required
					/>
					<FormControl
						fullWidth
						required
						error={!!errors.type}
					>
						<InputLabel>Type</InputLabel>
						<Select
							value={type}
							onChange={(e) => {
								setType(e.target.value);
								clearFieldError('type');
							}}
							label="Type"
						>
							<MenuItem value="OnboardingCase">Onboarding Case</MenuItem>
							<MenuItem value="Stage">Stage</MenuItem>
							<MenuItem value="Task">Task</MenuItem>
							<MenuItem value="WorkflowGuide">Workflow Guide</MenuItem>
						</Select>
						{errors.type && (
							<Typography
								variant="caption"
								color="error"
								className="mt-1"
							>
								{errors.type}
							</Typography>
						)}
					</FormControl>
				</Box>
				<TextField
					label="Template ID"
					value={templateId}
					fullWidth
					className="mb-5"
					InputProps={{
						readOnly: true
					}}
					helperText="Template ID cannot be modified"
				/>
				<TextField
					label="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					multiline
					rows={3}
					fullWidth
					className="mb-5"
				/>
				<Divider />
			</Box>

			{/* Classification */}
			<Box className="mb-5">
				<Typography
					variant="h6"
					className="mb-5"
				>
					Classification
				</Typography>
				<Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
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
					<FormControl fullWidth>
						<InputLabel>Status</InputLabel>
						<Select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							label="Status"
						>
							<MenuItem value="Draft">Draft</MenuItem>
							<MenuItem value="Published">Published</MenuItem>
							<MenuItem value="Deprecated">Deprecated</MenuItem>
							<MenuItem value="Archived">Archived</MenuItem>
						</Select>
					</FormControl>
				</Box>
				<Divider />
			</Box>

			{/* Estimates and Version */}
			<Box className="mb-5">
				<Typography
					variant="h6"
					className="mb-5"
				>
					Estimates & Version
				</Typography>
				<Box className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
					<TextField
						label="Version"
						value={version}
						onChange={(e) => setVersion(e.target.value)}
						fullWidth
					/>
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
				<Divider />
			</Box>

			{/* Tags and Categories */}
			<Box className="mb-5">
				<Typography
					variant="h6"
					className="mb-5"
				>
					Tags & Categories
				</Typography>

				{/* Tags */}
				<Box className="mb-5">
					<Typography
						variant="subtitle1"
						className="mb-3"
					>
						Tags
					</Typography>
					<Box className="flex gap-2 mb-2">
						<TextField
							label="Add Tag"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
							size="small"
							className="flex-1"
						/>
						<Button
							onClick={handleAddTag}
							variant="outlined"
							size="small"
						>
							Add
						</Button>
					</Box>
					<Box className="flex flex-wrap gap-2">
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
				<Box className="mb-5">
					<Typography
						variant="subtitle1"
						className="mb-3"
					>
						Categories
					</Typography>
					<Box className="flex gap-2 mb-2">
						<TextField
							label="Add Category"
							value={categoryInput}
							onChange={(e) => setCategoryInput(e.target.value)}
							onKeyPress={(e) => handleKeyPress(e, handleAddCategory)}
							size="small"
							className="flex-1"
						/>
						<Button
							onClick={handleAddCategory}
							variant="outlined"
							size="small"
						>
							Add
						</Button>
					</Box>
					<Box className="flex flex-wrap gap-2">
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
				<Divider />
			</Box>

			{/* Options */}
			<Box className="mb-5">
				<Typography
					variant="h6"
					className="mb-5"
				>
					Options
				</Typography>
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

			{errors.submit && <Alert severity="error">{errors.submit}</Alert>}
		</div>
	);
}

export default TemplateEdit;
