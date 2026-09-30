import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './src/server/routes';

dotenv.config();

export async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRoutes);

  if (!isProd) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist files from root dist directory
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[TenderGuard] Server running on http://0.0.0.0:${port}`);
  });
}

// Auto-start server
startServer().catch((err) => {
  console.error('[TenderGuard] Server failed to start:', err);
  process.exit(1);
});
