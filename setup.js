const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🚀 Salesforce Lightning Out Application Setup\n');

// Generate a secure session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

// Create .env file with minimal configuration
const envContent = `# Salesforce Lightning Out Application Configuration
# Generated on ${new Date().toISOString()}

# Required: Salesforce Connected App credentials
SF_CLIENT_ID=
SF_CLIENT_SECRET=

# Required: Your application host URL (must be HTTPS in production)
# Examples:
#   - Render: https://your-app.onrender.com
#   - Railway: https://your-app.railway.app
#   - Fly.io: https://your-app.fly.dev
APP_URL=http://localhost:5000

# Required: Session secret for secure session management (auto-generated)
SESSION_SECRET=${sessionSecret}

# Optional: Salesforce login URL (defaults to https://login.salesforce.com)
SF_LOGIN_URL=https://login.salesforce.com

# Optional: Port (defaults to 5000)
PORT=5000
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with secure session secret');
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env file and add your Salesforce credentials:');
  console.log('   - SF_CLIENT_ID (from your Salesforce Connected App)');
  console.log('   - SF_CLIENT_SECRET (from your Salesforce Connected App)');
  console.log('\n2. If deploying to a different host, update REPLIT_HOST');
  console.log('\n3. Run: npm start');
  console.log('\n📚 See replit.md for detailed Salesforce setup instructions');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}