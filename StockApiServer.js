import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import stockRoutes from './routes/stockRoutes.js';
import ApiError from './utils/ApiError.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

class StockApiServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    // Initialize services
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // Request logging
    this.app.use(morgan('dev', { stream: { write: message => logger.info(message.trim()) } }));
    
    // Enable CORS
    this.app.use(cors());
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/stocks', stockRoutes);

    // 404 handler
    this.app.use((req, res, next) => {
      next(new ApiError(404, 'Not Found'));
    });
  }

  initializeErrorHandling() {
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      
      logger.error(`[${statusCode}] ${message}`, {
        status: statusCode,
        error: {
          message: message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : {}
        },
        path: req.path,
        method: req.method
      });

      res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  async start() {
    try {
      // Connect to MongoDB (optional for a dummy project)
      if (process.env.NODE_ENV !== 'test') {
        await connectDB();
      }
      
      // Start the server
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
        logger.error(err.name, err.message);
        this.server.close(() => {
          process.exit(1);
        });
      });

      // Handle uncaught exceptions
      process.on('uncaughtException', (err) => {
        logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        logger.error(err.name, err.message);
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  async stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('Server stopped');
      });
    }
  }
}

// Only start the server if this file is run directly (not required/imported)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const server = new StockApiServer();
  server.start();

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default StockApiServer;
