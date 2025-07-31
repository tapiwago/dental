import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const Dashboard = lazy(() => import('./Dashboard'));

/**
 * The Dashboard page route.
 */
const DashboardRoute: FuseRouteItemType = {
	path: 'dashboard',
	element: <Dashboard />,
	auth: authRoles.teamMember // All authenticated users can access dashboard
};

export default DashboardRoute;
