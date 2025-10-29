/**
 * PM2 Ecosystem Configuration
 * Configuration for managing Weaver services with PM2
 */

module.exports = {
  apps: [
    {
      name: 'weaver-mcp',
      script: './dist/mcp-server/cli.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 1000,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },

      // Logging
      out_file: './logs/weaver-mcp-out.log',
      error_file: './logs/weaver-mcp-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // Monitoring
      instance_var: 'INSTANCE_ID',
    },

    // Add more services as needed
    {
      name: 'weaver-file-watcher',
      script: './dist/file-watcher/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 1000,

      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },

      out_file: './logs/weaver-file-watcher-out.log',
      error_file: './logs/weaver-file-watcher-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      kill_timeout: 5000,
      listen_timeout: 3000,
    },

    // Workflow engine service
    {
      name: 'weaver-workflow-engine',
      script: './dist/workflow-engine/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 1000,

      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },

      out_file: './logs/weaver-workflow-engine-out.log',
      error_file: './logs/weaver-workflow-engine-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],

  /**
   * Deployment configuration (optional)
   */
  deploy: {
    production: {
      user: 'weaver',
      host: 'localhost',
      ref: 'origin/master',
      repo: 'git@github.com:weave-nn/weaver.git',
      path: '/var/www/weaver',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
    },

    development: {
      user: 'weaver',
      host: 'localhost',
      ref: 'origin/develop',
      repo: 'git@github.com:weave-nn/weaver.git',
      path: '/var/www/weaver-dev',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env development',
    },
  },
};
