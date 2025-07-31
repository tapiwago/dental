import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const Onboarding = lazy(() => import('./Onboarding'));

/**
 * The Onboarding page route.
 */
const OnboardingRoute: FuseRouteItemType = {
	path: 'onboarding',
	element: <Onboarding />,
	auth: authRoles.teamMember // All authenticated users can access onboarding
};

export default OnboardingRoute;
