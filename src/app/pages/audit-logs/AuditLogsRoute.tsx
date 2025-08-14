import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const AuditLogs = lazy(() => import('./AuditLogs'));

/**
 * The Audit Logs page route.
 */
const AuditLogsRoute: FuseRouteItemType = {
	path: 'audit-logs',
	element: <AuditLogs />,
	auth: authRoles.admin // Only admins can access audit logs
};

export default AuditLogsRoute;