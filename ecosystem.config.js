module.exports = {
  apps: [
    {
      name: 'dental-frontend',
      script: 'serve',
      args: '-s dist -l 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/dental-frontend.log',
      out_file: './logs/dental-frontend-out.log',
      error_file: './logs/dental-frontend-error.log',
      max_memory_restart: '512M'
    },
    {
      name: 'dental-api',
      script: '../dental-api/src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_file: './logs/dental-api.log',
      out_file: './logs/dental-api-out.log',
      error_file: './logs/dental-api-error.log',
      max_memory_restart: '1G'
    }
  ]
};
