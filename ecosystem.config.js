module.exports = {
  apps: [
    {
      name: 'bilibili-cleaner-backend',
      script: './rebuild/backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8123,
        HOST: 'localhost'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8123,
        HOST: '0.0.0.0',
        FRONTEND_URL: 'http://your-domain.com:11451',
        LOG_LEVEL: 'info'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};