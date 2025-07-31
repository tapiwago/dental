import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@fuse/core/Link';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import useJwtAuth from '../useJwtAuth';
import { AuthFetchError } from '@/utils/authFetch';

/**
 * Form Validation Schema
 */
const schema = z.object({
	firstName: z.string().nonempty('You must enter your first name'),
	password: z
		.string()
		.min(4, 'Password is too short - must be at least 4 chars.')
		.nonempty('Please enter your password.'),
	remember: z.boolean().optional()
});

type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
	firstName: '',
	password: '',
	remember: true
};

function JwtSignInForm() {
	const { signIn } = useJwtAuth();

	const { control, formState, handleSubmit, setValue, setError } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	useEffect(() => {
		setValue('firstName', 'Jane', { shouldDirty: true, shouldValidate: true });
		setValue('password', 'password123', { shouldDirty: true, shouldValidate: true });
	}, [setValue]);

	function onSubmit(formData: FormType) {
		const { firstName, password } = formData;

		console.log('JwtSignInForm: Attempting sign in with:', { firstName, password: '***' });
		console.log('JwtSignInForm: Environment VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

		signIn({
			firstName,
			password
		})
		.then(() => {
			console.log('JwtSignInForm: Sign in successful!');
		})
		.catch((error: AuthFetchError) => {
			console.error('Sign in error:', error);
			
			// Handle different types of errors
			if (error instanceof AuthFetchError) {
				const errorData = error.data as {
					success: boolean;
					error: string;
				};

				// Set a general error message
				setError('root', {
					type: 'manual',
					message: errorData?.error || 'Invalid credentials. Please check your first name and password.'
				});
			} else {
				// Handle network or other errors
				setError('root', {
					type: 'manual',
					message: 'Network error. Please try again.'
				});
			}
		});
	}

	return (
		<form
			name="loginForm"
			noValidate
			className="mt-8 flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{errors.root && (
				<Alert severity="error" className="mb-4">
					{errors.root.message}
				</Alert>
			)}

			<Controller
				name="firstName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="First Name"
						autoFocus
						type="text"
						error={!!errors.firstName}
						helperText={errors?.firstName?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Password"
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Button
				variant="contained"
				color="secondary"
				className=" mt-4 w-full"
				aria-label="Sign in"
				disabled={_.isEmpty(dirtyFields) || !isValid}
				type="submit"
				size="large"
			>
				Sign in
			</Button>
		</form>
	);
}

export default JwtSignInForm;
