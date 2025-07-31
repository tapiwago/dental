import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Clients = lazy(() => import('./Clients'));

/**
 * The Clients page config.
 */
const ClientsRoute: FuseRouteItemType = {
	path: '/clients',
	element: <Clients />
};

export default ClientsRoute;
