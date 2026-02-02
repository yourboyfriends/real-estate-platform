import 'dotenv/config';
import app from './app';
import { testConnection } from './config/database';




const PORT = process.env.PORT || 3001;

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    console.log(' Starting Real Estate API Server...');
    console.log(' Environment:', process.env.NODE_ENV || 'development');
    
    // Test database connection
    console.log(' Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error(' Failed to connect to database');
      process.exit(1);
    }
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log(' Server is running successfully!');
      console.log(`API URL: http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log(' Available Endpoints:');
      console.log('   - POST   /api/auth/register');
      console.log('   - POST   /api/auth/login');
      console.log('   - GET    /api/auth/me');
      console.log('   - PUT    /api/auth/profile');
      console.log('   - GET    /api/properties');
      console.log('   - GET    /api/properties/:id');
      console.log('   - POST   /api/properties');
      console.log('   - PUT    /api/properties/:id');
      console.log('   - DELETE /api/properties/:id');
      console.log('   - GET    /api/categories');
      console.log('   - GET    /api/blog/posts');
      console.log('   - GET    /api/blog/posts/:slug');
      console.log('');
      console.log(' Ready to receive requests!');
      console.log('');
    });
    
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Start the server
startServer();