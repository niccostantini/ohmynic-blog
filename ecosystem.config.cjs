module.exports = {
  apps: [
    {
      name: 'ohmynic-blog',
      script: 'build/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
    },
  ],
};
