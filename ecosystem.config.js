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
      log_file: '/var/www/dental/logs/dental-frontend.log',
      out_file: '/var/www/dental/logs/dental-frontend-out.log',
      error_file: '/var/www/dental/logs/dental-frontend-error.log',
      max_memory_restart: '512M'
    },
    {
      name: 'dental-api',
      script: '../dental-api/src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: 'mongodb://localhost:27017/dental_db',
        DB_NAME: 'dental_db'
      },
      log_file: '/var/www/dental/logs/dental-api.log',
      out_file: '/var/www/dental/logs/dental-api-out.log',
      error_file: '/var/www/dental/logs/dental-api-error.log',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs']
    }
  ]
};
