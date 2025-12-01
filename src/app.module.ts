import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { AppController } from "./app.controller";
import { LoggerModule } from './logger.module'
import { DynamicConfigModule } from './dynamicConfig.module'
import { AppService } from './app.service'
import { LoggerMiddleware } from "./logger.middleware";
import { LoggerFunctionMiddleware } from "./logger-function.middleware";

@Module({
  imports: [LoggerModule, DynamicConfigModule.forRoot('456')],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
// export class AppModule implements NestModule{
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//     // .apply(LoggerMiddleware)
//     .apply(LoggerFunctionMiddleware)
//     // .forRoutes({
//     //   path: 'config',
//     //   method: RequestMethod.GET,
//     // });
//     .exclude({
//       path: 'app/config',
//       method: RequestMethod.GET,
//     })
//     .forRoutes(AppController);
//   }
// }