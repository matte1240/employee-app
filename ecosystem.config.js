module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'employee-tracker',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true
    },
    {
      name: 'db-backup-cron',
      script: 'scripts/backup-db.sh',
      instances: 1,
      autorestart: false,
      cron_restart: '0 2 * * *', // Daily at 2:00 AM
      watch: false,
      error_file: './logs/backup-error.log',
      out_file: './logs/backup-out.log',
      time: true
    },
    {
      name: 'backup-cleanup-cron',
      script: 'scripts/cleanup-backups.sh',
      args: '30 7', // Keep backups for 30 days, minimum 7 backups
      instances: 1,
      autorestart: false,
      cron_restart: '0 3 * * 0', // Weekly on Sunday at 3:00 AM
      watch: false,
      error_file: './logs/cleanup-error.log',
      out_file: './logs/cleanup-out.log',
      time: true
    }
  ]
};
