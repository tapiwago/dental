import React, { useState, useEffect } from 'react';
import {
	Typography,
	Paper,
	Box,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Card,
	CardContent,
	CircularProgress,
	Alert,
	Chip,
	FormControlLabel,
	Switch
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useParams } from 'react-router';
import useNavigate from '@fuse/hooks/useNavigate';
import { templateApi, fetchJson } from '@/utils/authFetch';
import useUser from '@auth/useUser';

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
		if (!templateId.trim()) {
			newErrors.templateId = 'Template ID is required';
		}
		if (!user?._id) {
			newErrors.user = 'User information not available';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) return;

		// Ensure user is available
		if (!user?._id) {
			setErrors({ submit: 'User information not available. Please refresh and try again.' });
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
				tags: tags.filter(tag => tag.trim()),
				categories: categories.filter(cat => cat.trim()),
				isDefault,
				lastModifiedBy: user._id
			};

			const response = await templateApi.update(id!, templateData);
			const data = await fetchJson(response);

			if (data._id) {
				navigate(`/workflow-templates/template/${id}`);
			} else {
				setErrors({ submit: data.error || 'Failed to update template' });
			}
		} catch (error: any) {
			console.error('Error updating template:', error);
			setErrors({ submit: 'Failed to update template. Please try again.' });
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
				<Alert severity="error" className="mb-16">
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
		<div className="w-full p-24">
			{/* Header */}
			<Box className="mb-24">
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={handleBack}
					className="mb-16"
				>
					Back to Template
				</Button>
				
				<Box className="flex items-center justify-between">
					<div>
						<Typography variant="h4" className="font-bold">
							Edit Template: {name}
						</Typography>
						<Typography variant="body1" color="text.secondary">
							Template ID: {templateId}
						</Typography>
					</div>
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

			<Box className="space-y-24">
				{/* Basic Information */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">Basic Information</Typography>
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
							helperText={errors.templateId}
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
					</CardContent>
				</Card>

				{/* Classification */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">Classification</Typography>
						<Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
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
					</CardContent>
				</Card>

				{/* Estimates and Version */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">Estimates & Version</Typography>
						<Box className="grid grid-cols-1 md:grid-cols-3 gap-16">
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
					</CardContent>
				</Card>

				{/* Tags and Categories */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">Tags & Categories</Typography>
						
						{/* Tags */}
						<Box className="mb-24">
							<Typography variant="subtitle1" className="mb-12">Tags</Typography>
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
							<Typography variant="subtitle1" className="mb-12">Categories</Typography>
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
					</CardContent>
				</Card>

				{/* Options */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">Options</Typography>
						<FormControlLabel
							control={
								<Switch
									checked={isDefault}
									onChange={(e) => setIsDefault(e.target.checked)}
								/>
							}
							label="Set as default template for this type"
						/>
					</CardContent>
				</Card>

				{errors.submit && (
					<Alert severity="error">
						{errors.submit}
					</Alert>
				)}
			</Box>
		</div>
	);
}

export default TemplateEdit;
