import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Users = lazy(() => import('./Users'));

/**
 * The Users page config.
 */
const UsersRoute: FuseRouteItemType = {
	path: '/users',
	element: <Users />
};

export default UsersRoute;
