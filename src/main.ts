import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  await app.init();

  // ✅ If running locally, start listening on a port
  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
  }
}

bootstrap();

// ✅ Export server for Vercel (serverless)
export default server;
