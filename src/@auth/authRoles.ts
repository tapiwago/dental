/**
 * The authRoles object defines the authorization roles for the Fuse application.
 * Roles match the backend User model: Admin, Champion, Team Member, Senior Champion
 */
const authRoles = {
	/**
	 * The admin role grants access to users with the 'Admin' role only.
	 */
	admin: ['Admin'],

	/**
	 * The champion role grants access to users with 'Admin', 'Champion', or 'Senior Champion' roles.
	 */
	champion: ['Admin', 'Champion', 'Senior Champion'],

	/**
	 * The teamMember role grants access to all authenticated users.
	 */
	teamMember: ['Admin', 'Champion', 'Senior Champion', 'Team Member'],

	/**
	 * The senior role grants access to users with 'Admin' or 'Senior Champion' roles.
	 */
	senior: ['Admin', 'Senior Champion'],

	/**
	 * The onlyGuest role grants access to unauthenticated users.
	 */
	onlyGuest: []
};

export default authRoles;
