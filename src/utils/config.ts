// Configuration utility for the application
interface AppConfig {
	API_BASE_URL: string;
	NODE_ENV: string;
}

let config: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

// Function to load config from public/config.json
export const loadConfig = async (): Promise<AppConfig> => {
	if (config) {
		return config;
	}

	if (configPromise) {
		return configPromise;
	}

	configPromise = fetch('/config.json')
		.then((response) => response.json())
		.then((loadedConfig: AppConfig) => {
			config = loadedConfig;
			console.log('Config loaded:', config);
			return config;
		})
		.catch((error) => {
			console.warn('Failed to load config.json, using defaults:', error);
			config = {
				API_BASE_URL: 'http://localhost:5000',
				NODE_ENV: 'development'
			};
			return config;
		});

	return configPromise;
};

// Get current config (may be null if not loaded yet)
export const getConfig = (): AppConfig | null => config;

// Get API base URL with fallback
export const getApiBaseUrl = (): string => {
	if (config) {
		return config.API_BASE_URL || 'http://localhost:5000';
	}

	// Fallback to environment variable if config not loaded
	return (import.meta?.env?.VITE_API_BASE_URL as string) || 'http://localhost:5000';
};

// Initialize config loading on module import
loadConfig();

export default { loadConfig, getConfig, getApiBaseUrl };
