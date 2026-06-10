require('dotenv').config();

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
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        NOTIFY_EMAIL: process.env.NOTIFY_EMAIL,
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
      },
    },
  ],
};
