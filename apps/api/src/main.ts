import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Allow BigInt values to be serialized in JSON responses
(
  BigInt.prototype as bigint & {
    toJSON: () => string;
  }
).toJSON = function (this: bigint) {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  const webAppUrl = process.env.WEB_APP_URL;
  if (!webAppUrl) {
    throw new Error('WEB_APP_URL must be set');
  }
  const cookieParserFactory = cookieParser as unknown as () => Parameters<
    typeof app.use
  >[0];
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );
  app.use(cookieParserFactory());
  app.useBodyParser('json', {
    limit: process.env.API_JSON_BODY_LIMIT ?? '1mb',
  });
  app.useBodyParser('urlencoded', {
    extended: true,
    limit: process.env.API_URLENCODED_BODY_LIMIT ?? '1mb',
  });
  app.enableCors({
    origin: webAppUrl,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
