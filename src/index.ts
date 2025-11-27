import { createServer } from 'http';
import { bot } from './bot.js';
import { logger } from './logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap() {
  try {
    await bot.init();
    logger.info(`Bot started as @${bot.botInfo.username}`);

    // Start HTTP server with health check endpoint
    const server = createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Health check server listening on port ${PORT}`);
    });

    // Start bot
    await bot.start();
  } catch (error) {
    logger.error(error, "Error starting bot");
    process.exit(1);
  }
}

bootstrap();

