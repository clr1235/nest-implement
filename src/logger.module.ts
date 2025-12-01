import { Module } from '@nestjs/common';
import { LoggerClassService, LoggerService, UseValueService, UserFactoryService } from './logger.service'


@Module({
  providers: [
    LoggerClassService, // 等价于下面的写法
    {
      provide: LoggerService,
      useClass: LoggerService, // 提供一个类，nestjs会自动实例化这个类
    },
    {
      provide: 'StringToken', // 字符串token,也就是provider的名字
      useValue: new UseValueService() // 提供一个值
    },
    {
      provide: 'FactoryToken',
      useFactory: () => new UserFactoryService(), // 提供一个工厂函数，nestjs会自动调用这个函数，返回一个实例
    }
  ],
  exports: [LoggerService, LoggerClassService, 'StringToken', 'FactoryToken'],
})
export class LoggerModule {}
