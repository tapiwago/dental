import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import JwtSignInForm from '@auth/services/jwt/components/JwtSignInForm';

function jwtSignInTab() {
	return (
		<div className="w-full">
			<JwtSignInForm />
		</div>
	);
}

export default jwtSignInTab;
