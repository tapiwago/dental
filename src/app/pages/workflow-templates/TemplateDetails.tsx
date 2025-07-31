import React, { useState, useEffect } from 'react';
import {
	Typography,
	Paper,
	Box,
	Chip,
	Divider,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemText,
	Button,
	CircularProgress,
	Alert,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow
} from '@mui/material';
import { 
	ArrowBack as ArrowBackIcon, 
	ExpandMore as ExpandMoreIcon,
	Edit as EditIcon,
	ContentCopy as CloneIcon,
	Publish as PublishIcon,
	Star as StarIcon
} from '@mui/icons-material';
import { useParams } from 'react-router';
import useNavigate from '@fuse/hooks/useNavigate';
import { templateApi, fetchJson } from '@/utils/authFetch';

interface TemplateDetails {
	_id: string;
	templateId: string;
	name: string;
	description?: string;
	type: 'OnboardingCase' | 'Stage' | 'Task' | 'WorkflowGuide';
	configuration: {
		defaultStages?: Array<{
			name: string;
			sequence: number;
			description?: string;
			estimatedDuration?: number;
			isRequired: boolean;
			tasks?: Array<{
				name: string;
				description?: string;
				estimatedHours?: number;
				isRequired: boolean;
				priority: string;
				skillsRequired: string[];
			}>;
		}>;
		defaultSteps?: Array<{
			title: string;
			content: string;
			hintType?: string;
			mediaType?: string;
			sequence: number;
		}>;
		defaultSettings?: any;
	};
	industryType: 'Dental' | 'Medical' | 'Veterinary' | 'General';
	clientSize: 'Small' | 'Medium' | 'Large' | 'Enterprise';
	complexity: 'Simple' | 'Standard' | 'Complex' | 'Enterprise';
	status: 'Draft' | 'Published' | 'Deprecated' | 'Archived';
	version: string;
	isDefault: boolean;
	usageCount: number;
	successRate: number;
	averageCompletionTime?: number;
	estimatedDuration?: number;
	estimatedCost?: number;
	tags: string[];
	categories: string[];
	createdBy: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	lastModifiedBy?: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	approvedBy?: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
	};
	approvalDate?: string;
	parentTemplateId?: {
		_id: string;
		name: string;
		templateId: string;
	};
	childTemplates?: Array<{
		_id: string;
		name: string;
		templateId: string;
	}>;
	relatedTemplates?: Array<{
		_id: string;
		name: string;
		templateId: string;
	}>;
	createdAt: string;
	updatedAt: string;
}

function TemplateDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

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
				setTemplateDetails(data);
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

	const getStatusColor = (status: string) => {
		const colors = {
			'Draft': 'default',
			'Published': 'success',
			'Deprecated': 'warning',
			'Archived': 'error'
		};
		return colors[status as keyof typeof colors] || 'default';
	};

	const getComplexityColor = (complexity: string) => {
		const colors = {
			'Simple': 'success',
			'Standard': 'info',
			'Complex': 'warning',
			'Enterprise': 'error'
		};
		return colors[complexity as keyof typeof colors] || 'default';
	};

	const getTypeColor = (type: string) => {
		const colors = {
			'OnboardingCase': 'primary',
			'Stage': 'secondary',
			'Task': 'info',
			'WorkflowGuide': 'success'
		};
		return colors[type as keyof typeof colors] || 'default';
	};

	const handleBack = () => {
		navigate('/workflow-templates');
	};

	const handleEdit = () => {
		navigate(`/workflow-templates/template/${id}/edit`);
	};

	const handleClone = async () => {
		try {
			const response = await templateApi.clone(id!, {
				name: `${templateDetails?.name} (Copy)`,
				description: `Copy of ${templateDetails?.description || templateDetails?.name}`
			});
			const data = await fetchJson(response);
			
			if (data._id) {
				navigate(`/workflow-templates/template/${data._id}`);
			}
		} catch (error) {
			console.error('Error cloning template:', error);
		}
	};

	const handlePublish = async () => {
		try {
			const response = await templateApi.publish(id!);
			const data = await fetchJson(response);
			
			if (data._id) {
				await fetchTemplateDetails(); // Refresh the details
			}
		} catch (error) {
			console.error('Error publishing template:', error);
		}
	};

	const handleSetDefault = async () => {
		try {
			const response = await templateApi.setDefault(id!);
			const data = await fetchJson(response);
			
			if (data._id) {
				await fetchTemplateDetails(); // Refresh the details
			}
		} catch (error) {
			console.error('Error setting default template:', error);
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
					onClick={handleBack}
				>
					Back to Templates
				</Button>
			</Box>
		);
	}

	if (!templateDetails) {
		return (
			<Box className="p-24">
				<Alert severity="warning" className="mb-16">
					Template not found
				</Alert>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={handleBack}
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
					Back to Templates
				</Button>
				
				<Box className="flex items-center justify-between">
					<div>
						<Typography variant="h4" className="font-bold">
							{templateDetails.name}
						</Typography>
						<Typography variant="body1" color="text.secondary">
							Template ID: {templateDetails.templateId}
						</Typography>
						{templateDetails.description && (
							<Typography variant="body2" color="text.secondary" className="mt-8">
								{templateDetails.description}
							</Typography>
						)}
					</div>
					<Box className="flex gap-8">
						<Chip
							label={templateDetails.status}
							color={getStatusColor(templateDetails.status) as any}
							size="medium"
						/>
						<Chip
							label={templateDetails.type}
							color={getTypeColor(templateDetails.type) as any}
							size="medium"
						/>
						<Chip
							label={templateDetails.complexity}
							color={getComplexityColor(templateDetails.complexity) as any}
							size="medium"
						/>
						{templateDetails.isDefault && (
							<Chip
								icon={<StarIcon />}
								label="Default"
								color="warning"
								size="medium"
							/>
						)}
					</Box>
				</Box>

				{/* Action Buttons */}
				<Box className="flex gap-8 mt-16">
					<Button
						variant="contained"
						startIcon={<EditIcon />}
						onClick={handleEdit}
					>
						Edit
					</Button>
					<Button
						variant="outlined"
						startIcon={<CloneIcon />}
						onClick={handleClone}
					>
						Clone
					</Button>
					{templateDetails.status === 'Draft' && (
						<Button
							variant="outlined"
							startIcon={<PublishIcon />}
							onClick={handlePublish}
							color="success"
						>
							Publish
						</Button>
					)}
					{!templateDetails.isDefault && (
						<Button
							variant="outlined"
							startIcon={<StarIcon />}
							onClick={handleSetDefault}
							color="warning"
						>
							Set as Default
						</Button>
					)}
				</Box>
			</Box>

			<Box className="grid grid-cols-1 md:grid-cols-2 gap-24">
				{/* Template Information */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">
							Template Information
						</Typography>
						<Box className="space-y-12">
							<Box>
								<Typography variant="body2" color="text.secondary">
									Type
								</Typography>
								<Typography variant="body1">
									{templateDetails.type}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Industry Type
								</Typography>
								<Typography variant="body1">
									{templateDetails.industryType}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Client Size
								</Typography>
								<Typography variant="body1">
									{templateDetails.clientSize}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Version
								</Typography>
								<Typography variant="body1">
									{templateDetails.version}
								</Typography>
							</Box>
							{templateDetails.estimatedDuration && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Estimated Duration
									</Typography>
									<Typography variant="body1">
										{templateDetails.estimatedDuration} days
									</Typography>
								</Box>
							)}
							{templateDetails.estimatedCost && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Estimated Cost
									</Typography>
									<Typography variant="body1">
										${templateDetails.estimatedCost.toFixed(2)}
									</Typography>
								</Box>
							)}
						</Box>
					</CardContent>
				</Card>

				{/* Analytics */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">
							Analytics
						</Typography>
						<Box className="space-y-12">
							<Box>
								<Typography variant="body2" color="text.secondary">
									Usage Count
								</Typography>
								<Typography variant="body1">
									{templateDetails.usageCount}
								</Typography>
							</Box>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Success Rate
								</Typography>
								<Typography variant="body1">
									{templateDetails.successRate}%
								</Typography>
							</Box>
							{templateDetails.averageCompletionTime && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Average Completion Time
									</Typography>
									<Typography variant="body1">
										{templateDetails.averageCompletionTime} days
									</Typography>
								</Box>
							)}
							<Box>
								<Typography variant="body2" color="text.secondary">
									Created By
								</Typography>
								<Typography variant="body1">
									{templateDetails.createdBy.firstName} {templateDetails.createdBy.lastName}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{new Date(templateDetails.createdAt).toLocaleDateString()}
								</Typography>
							</Box>
							{templateDetails.lastModifiedBy && (
								<Box>
									<Typography variant="body2" color="text.secondary">
										Last Modified By
									</Typography>
									<Typography variant="body1">
										{templateDetails.lastModifiedBy.firstName} {templateDetails.lastModifiedBy.lastName}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{new Date(templateDetails.updatedAt).toLocaleDateString()}
									</Typography>
								</Box>
							)}
						</Box>
					</CardContent>
				</Card>
			</Box>

			{/* Tags and Categories */}
			<Box className="mt-24 space-y-16">
				{(templateDetails.tags.length > 0 || templateDetails.categories.length > 0) && (
					<Card>
						<CardContent>
							<Typography variant="h6" className="mb-16">
								Tags & Categories
							</Typography>
							{templateDetails.tags.length > 0 && (
								<Box className="mb-12">
									<Typography variant="body2" color="text.secondary" className="mb-8">
										Tags
									</Typography>
									<Box className="flex flex-wrap gap-8">
										{templateDetails.tags.map((tag, index) => (
											<Chip key={index} label={tag} size="small" color="primary" variant="outlined" />
										))}
									</Box>
								</Box>
							)}
							{templateDetails.categories.length > 0 && (
								<Box>
									<Typography variant="body2" color="text.secondary" className="mb-8">
										Categories
									</Typography>
									<Box className="flex flex-wrap gap-8">
										{templateDetails.categories.map((category, index) => (
											<Chip key={index} label={category} size="small" color="secondary" variant="outlined" />
										))}
									</Box>
								</Box>
							)}
						</CardContent>
					</Card>
				)}

				{/* Configuration */}
				<Card>
					<CardContent>
						<Typography variant="h6" className="mb-16">
							Configuration
						</Typography>
						
						{/* Default Stages */}
						{templateDetails.configuration.defaultStages && templateDetails.configuration.defaultStages.length > 0 && (
							<Accordion>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="subtitle1">
										Default Stages ({templateDetails.configuration.defaultStages.length})
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Sequence</TableCell>
													<TableCell>Name</TableCell>
													<TableCell>Description</TableCell>
													<TableCell>Duration</TableCell>
													<TableCell>Required</TableCell>
													<TableCell>Tasks</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{templateDetails.configuration.defaultStages.map((stage, index) => (
													<TableRow key={index}>
														<TableCell>{stage.sequence}</TableCell>
														<TableCell>{stage.name}</TableCell>
														<TableCell>{stage.description || '-'}</TableCell>
														<TableCell>{stage.estimatedDuration ? `${stage.estimatedDuration} days` : '-'}</TableCell>
														<TableCell>
															<Chip
																label={stage.isRequired ? 'Yes' : 'No'}
																color={stage.isRequired ? 'success' : 'default'}
																size="small"
															/>
														</TableCell>
														<TableCell>{stage.tasks?.length || 0}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</AccordionDetails>
							</Accordion>
						)}

						{/* Default Steps */}
						{templateDetails.configuration.defaultSteps && templateDetails.configuration.defaultSteps.length > 0 && (
							<Accordion className="mt-8">
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography variant="subtitle1">
										Default Steps ({templateDetails.configuration.defaultSteps.length})
									</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<List>
										{templateDetails.configuration.defaultSteps.map((step, index) => (
											<ListItem key={index} divider>
												<ListItemText
													primary={`${step.sequence}. ${step.title}`}
													secondary={step.content}
												/>
											</ListItem>
										))}
									</List>
								</AccordionDetails>
							</Accordion>
						)}
					</CardContent>
				</Card>

				{/* Related Templates */}
				{(templateDetails.parentTemplateId || 
				  (templateDetails.childTemplates && templateDetails.childTemplates.length > 0) ||
				  (templateDetails.relatedTemplates && templateDetails.relatedTemplates.length > 0)) && (
					<Card>
						<CardContent>
							<Typography variant="h6" className="mb-16">
								Related Templates
							</Typography>
							
							{templateDetails.parentTemplateId && (
								<Box className="mb-16">
									<Typography variant="subtitle2" className="mb-8">
										Parent Template
									</Typography>
									<Chip
										label={templateDetails.parentTemplateId.name}
										onClick={() => navigate(`/workflow-templates/template/${templateDetails.parentTemplateId!._id}`)}
										clickable
										color="primary"
									/>
								</Box>
							)}

							{templateDetails.childTemplates && templateDetails.childTemplates.length > 0 && (
								<Box className="mb-16">
									<Typography variant="subtitle2" className="mb-8">
										Child Templates
									</Typography>
									<Box className="flex flex-wrap gap-8">
										{templateDetails.childTemplates.map((child) => (
											<Chip
												key={child._id}
												label={child.name}
												onClick={() => navigate(`/workflow-templates/template/${child._id}`)}
												clickable
												color="secondary"
											/>
										))}
									</Box>
								</Box>
							)}

							{templateDetails.relatedTemplates && templateDetails.relatedTemplates.length > 0 && (
								<Box>
									<Typography variant="subtitle2" className="mb-8">
										Related Templates
									</Typography>
									<Box className="flex flex-wrap gap-8">
										{templateDetails.relatedTemplates.map((related) => (
											<Chip
												key={related._id}
												label={related.name}
												onClick={() => navigate(`/workflow-templates/template/${related._id}`)}
												clickable
												variant="outlined"
											/>
										))}
									</Box>
								</Box>
							)}
						</CardContent>
					</Card>
				)}
			</Box>
		</div>
	);
}

export default TemplateDetails;
