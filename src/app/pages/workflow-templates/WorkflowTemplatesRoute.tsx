import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const WorkflowTemplates = lazy(() => import('./WorkflowTemplates'));
const TemplateDetails = lazy(() => import('./TemplateDetails'));
const TemplateEdit = lazy(() => import('./TemplateEdit'));

/**
 * The Workflow Templates page routes.
 */
const WorkflowTemplatesRoute: FuseRouteItemType[] = [
	{
		path: 'workflow-templates',
		element: <WorkflowTemplates />,
		auth: authRoles.teamMember // All authenticated users can access templates
	},
	{
		path: 'workflow-templates/template/:id',
		element: <TemplateDetails />,
		auth: authRoles.teamMember // All authenticated users can access template details
	},
	{
		path: 'workflow-templates/template/:id/edit',
		element: <TemplateEdit />,
		auth: authRoles.teamMember // All authenticated users can edit templates
	}
];

export default WorkflowTemplatesRoute;
