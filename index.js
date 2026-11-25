require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./server/app');
const connectDB = require('./server/config/db');

// Export Express app for Vercel
module.exports = app;

// If run directly (node index.js), start HTTP server
if (require.main === module) {
  const port = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(port, () => console.log(`MENTRA running on http://localhost:${port}`)))
    .catch((err) => {
      console.error('Startup failed:', err.message);
      process.exit(1);
    });
}
