import { memo, useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	Backdrop,
	LinearProgress,
	keyframes
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import useSoundEffects from '@fuse/hooks/useSoundEffects';

// Futuristic animations
const glowPulse = keyframes`
	0% { box-shadow: 0 0 5px #00e5ff, 0 0 10px #00e5ff, 0 0 15px #00e5ff; }
	50% { box-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff, 0 0 30px #00e5ff; }
	100% { box-shadow: 0 0 5px #00e5ff, 0 0 10px #00e5ff, 0 0 15px #00e5ff; }
`;

const neonGlow = keyframes`
	0% { text-shadow: 0 0 5px #ff3d71, 0 0 10px #ff3d71, 0 0 15px #ff3d71; }
	50% { text-shadow: 0 0 10px #ff3d71, 0 0 20px #ff3d71, 0 0 30px #ff3d71; }
	100% { text-shadow: 0 0 5px #ff3d71, 0 0 10px #ff3d71, 0 0 15px #ff3d71; }
`;

const rotate = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`;

// Styled components
const StyledDialog = styled(Dialog)(() => ({
	'& .MuiDialog-paper': {
		background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
		border: '2px solid #00e5ff',
		borderRadius: '20px',
		boxShadow: '0 0 30px rgba(0, 229, 255, 0.3)',
		overflow: 'hidden',
		position: 'relative',
		'&::before': {
			content: '""',
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: 'linear-gradient(45deg, transparent 30%, rgba(0, 229, 255, 0.1) 50%, transparent 70%)',
			animation: `${glowPulse} 3s ease-in-out infinite`
		}
	}
}));

const CountdownContainer = styled(Box)(() => ({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	margin: '20px 0',
	zIndex: 1
}));

const CountdownCircle = styled(Box)(() => ({
	position: 'relative',
	width: '120px',
	height: '120px',
	borderRadius: '50%',
	background: 'linear-gradient(45deg, #ff3d71, #ff6b9d)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	animation: `${glowPulse} 2s ease-in-out infinite`,
	'&::before': {
		content: '""',
		position: 'absolute',
		top: '-5px',
		left: '-5px',
		right: '-5px',
		bottom: '-5px',
		borderRadius: '50%',
		background: 'conic-gradient(from 0deg, #00e5ff, #ff3d71, #00e5ff)',
		animation: `${rotate} 3s linear infinite`,
		zIndex: -1
	}
}));

const CountdownText = styled(Typography)(() => ({
	color: '#ffffff',
	fontSize: '2rem',
	fontWeight: 'bold',
	textAlign: 'center',
	animation: `${neonGlow} 2s ease-in-out infinite`,
	zIndex: 2
}));

const FuturisticButton = styled(Button)(() => ({
	background: 'linear-gradient(45deg, #00e5ff, #0288d1)',
	border: '2px solid #00e5ff',
	borderRadius: '25px',
	color: '#ffffff',
	fontSize: '1rem',
	fontWeight: 'bold',
	padding: '12px 30px',
	textTransform: 'uppercase',
	letterSpacing: '1px',
	position: 'relative',
	overflow: 'hidden',
	transition: 'all 0.3s ease',
	'&:hover': {
		background: 'linear-gradient(45deg, #0288d1, #00e5ff)',
		boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
		transform: 'translateY(-2px)'
	},
	'&::before': {
		content: '""',
		position: 'absolute',
		top: 0,
		left: '-100%',
		width: '100%',
		height: '100%',
		background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
		transition: 'left 0.5s ease'
	},
	'&:hover::before': {
		left: '100%'
	}
}));

const DangerButton = styled(FuturisticButton)(() => ({
	background: 'linear-gradient(45deg, #ff3d71, #f50057)',
	border: '2px solid #ff3d71',
	'&:hover': {
		background: 'linear-gradient(45deg, #f50057, #ff3d71)',
		boxShadow: '0 0 20px rgba(255, 61, 113, 0.5)'
	}
}));

const StyledBackdrop = styled(Backdrop)(() => ({
	backgroundColor: 'rgba(0, 0, 0, 0.8)',
	backdropFilter: 'blur(5px)'
}));

interface InactivityModalProps {
	open: boolean;
	countdownTime: number;
	onConfirm: () => void;
	onLogout: () => void;
}

/**
 * Futuristic inactivity warning modal with animated countdown
 */
function InactivityModal(props: InactivityModalProps) {
	const { open, countdownTime, onConfirm, onLogout } = props;
	const [progress, setProgress] = useState(100);
	const { playWarningSound, playCountdownBeep } = useSoundEffects();

	// Calculate progress percentage
	useEffect(() => {
		const maxTime = 60; // Assuming 60 seconds max
		const progressPercent = (countdownTime / maxTime) * 100;
		setProgress(progressPercent);
	}, [countdownTime]);

	// Play warning sound when modal opens
	useEffect(() => {
		if (open) {
			playWarningSound();
		}
	}, [open, playWarningSound]);

	// Play countdown beep for last 10 seconds
	useEffect(() => {
		if (open && countdownTime <= 10 && countdownTime > 0) {
			playCountdownBeep();
		}
	}, [open, countdownTime, playCountdownBeep]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<AnimatePresence>
			{open && (
				<StyledDialog
					open={open}
					maxWidth="sm"
					fullWidth
					disableEscapeKeyDown
					BackdropComponent={StyledBackdrop}
					PaperProps={{
						component: motion.div,
						initial: { scale: 0.5, opacity: 0, rotateX: -90 },
						animate: { scale: 1, opacity: 1, rotateX: 0 },
						exit: { scale: 0.5, opacity: 0, rotateX: 90 },
						transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 20 }
					}}
				>
					<DialogContent sx={{ textAlign: 'center', py: 4, position: 'relative', zIndex: 1 }}>
						{/* Header Icon */}
						<motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
						>
							<SecurityIcon
								sx={{
									fontSize: '4rem',
									color: '#00e5ff',
									mb: 2,
									filter: 'drop-shadow(0 0 10px #00e5ff)'
								}}
							/>
						</motion.div>

						{/* Title */}
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.5 }}
						>
							<Typography
								variant="h4"
								sx={{
									color: '#ffffff',
									fontWeight: 'bold',
									mb: 2,
									textShadow: '0 0 10px rgba(0, 229, 255, 0.5)'
								}}
							>
								Security Alert
							</Typography>
						</motion.div>

						{/* Subtitle */}
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.5 }}
						>
							<Typography
								variant="body1"
								sx={{
									color: '#b0bec5',
									mb: 3,
									fontSize: '1.1rem'
								}}
							>
								You've been inactive for 30 minutes. Please confirm your presence to continue your
								session.
							</Typography>
						</motion.div>

						{/* Countdown Timer */}
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
						>
							<CountdownContainer>
								<CountdownCircle>
									<CountdownText>{formatTime(countdownTime)}</CountdownText>
								</CountdownCircle>
								<Box sx={{ width: '200px', mt: 2 }}>
									<LinearProgress
										variant="determinate"
										value={progress}
										sx={{
											height: 8,
											borderRadius: 4,
											backgroundColor: 'rgba(255, 255, 255, 0.1)',
											'& .MuiLinearProgress-bar': {
												background: 'linear-gradient(90deg, #ff3d71, #00e5ff)',
												borderRadius: 4
											}
										}}
									/>
								</Box>
								<Typography
									variant="caption"
									sx={{ color: '#90a4ae', mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
								>
									<AccessTimeIcon fontSize="small" />
									Auto-logout in {countdownTime} seconds
								</Typography>
							</CountdownContainer>
						</motion.div>

						{/* Warning Message */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.8, duration: 0.5 }}
						>
							<Typography
								variant="body2"
								sx={{
									color: '#ff9800',
									fontStyle: 'italic',
									mt: 2
								}}
							>
								⚠️ Your session will be terminated automatically if no action is taken
							</Typography>
						</motion.div>
					</DialogContent>

					<DialogActions sx={{ justifyContent: 'center', pb: 4, gap: 2, position: 'relative', zIndex: 1 }}>
						<motion.div
							initial={{ opacity: 0, x: -50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 1, duration: 0.5 }}
						>
							<FuturisticButton
								onClick={onConfirm}
								startIcon={<TouchAppIcon />}
								size="large"
								aria-label="Confirm presence and continue session"
							>
								I'm Still Here
							</FuturisticButton>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 1.2, duration: 0.5 }}
						>
							<DangerButton
								onClick={onLogout}
								size="large"
								aria-label="Logout immediately"
							>
								Logout Now
							</DangerButton>
						</motion.div>
					</DialogActions>
				</StyledDialog>
			)}
		</AnimatePresence>
	);
}

export default memo(InactivityModal);
