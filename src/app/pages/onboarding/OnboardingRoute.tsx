import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const Onboarding = lazy(() => import('./Onboarding'));
const CaseDetails = lazy(() => import('./CaseDetails'));

/**
 * The Onboarding page routes.
 */
const OnboardingRoute: FuseRouteItemType[] = [
	{
		path: 'onboarding',
		element: <Onboarding />,
		auth: authRoles.teamMember // All authenticated users can access onboarding
	},
	{
		path: 'onboarding/case/:id',
		element: <CaseDetails />,
		auth: authRoles.teamMember // All authenticated users can access case details
	}
];

export default OnboardingRoute;
