import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('tr', 'navigation', tr);
i18n.addResourceBundle('ar', 'navigation', ar);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'dashboard',
		title: 'Dashboard',
		translate: 'DASHBOARD',
		type: 'item',
		icon: 'heroicons-outline:chart-pie',
		url: 'dashboard'
	},
	{
		id: 'onboarding',
		title: 'Onboarding',
		translate: 'ONBOARDING',
		type: 'item',
		icon: 'heroicons-outline:user-plus',
		url: 'onboarding'
	},
	{
		id: 'workflow-templates',
		title: 'Workflow Templates',
		translate: 'WORKFLOW_TEMPLATES',
		type: 'item',
		icon: 'heroicons-outline:document-duplicate',
		url: 'workflow-templates'
	},
	{
		id: 'clients',
		title: 'Clients',
		translate: 'CLIENTS',
		type: 'item',
		icon: 'heroicons-outline:user-group',
		url: 'clients'
	},
	{
		id: 'users',
		title: 'Users',
		translate: 'USERS',
		type: 'item',
		icon: 'heroicons-outline:users',
		url: 'users'
	},
	{
		id: 'example-component',
		title: 'Example',
		translate: 'EXAMPLE',
		type: 'item',
		icon: 'heroicons-outline:beaker',
		url: 'example'
	}
];

export default navigationConfig;
