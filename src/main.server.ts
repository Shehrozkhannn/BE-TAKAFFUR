import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import serverless from 'serverless-http';
import { AppModule } from './app.module';

let server: any;

async function bootstrapServer() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();
  await app.init();
  return serverless(expressApp);
}

export default async function handler(req: any, res: any) {
  server = server || (await bootstrapServer());
  return server(req, res);
}
