import { Controller, Get, HttpException, HttpStatus, Inject, Param } from "@nestjs/common";
import { LoggerClassService, LoggerService, UserFactoryService, UseValueService } from './logger.service'
import { AppService } from "./app.service";
import { ForbiddenException } from "./forbidden.exception";
import { ParseIntPipe } from "./@nestjs/common/pipes/parse-int.pipe";

@Controller()
export class AppController {
  constructor(
    private loggerClassService: LoggerClassService,
    private loggerService: LoggerService,
    @Inject('StringToken') private useValueService: UseValueService,
    @Inject('FactoryToken') private userFactoryService: UserFactoryService,
    private appService: AppService,
  ) {}
  
  // @Get('info')
  // index() {
  //   return 'hello'
  // }

  // @Get('log')
  // log() {
  //   this.loggerClassService.log('hello loggerClassService')
  //   this.loggerService.log('hello logger')
  //   this.useValueService.log('hello useValueService')
  //   this.userFactoryService.log('hello userFactoryService')
  //   return 'hello logger'
  // }

  // @Get('config')
  // config() {
  //   return 'config';
  // }

  // @Get('config/a')
  // getConfigA() {
  //   return 'config a'
  // }

  // @Get('abcde')
  // getConfigAbcde() {
  //   return 'config abcde'
  // }


  // @Get('exception')
  // exception() {
  //   // throw new Error('未识别的异常')
  //   // throw new HttpException('exception', 400)
  //   // throw new HttpException('forbidden', HttpStatus.FORBIDDEN)
  //   throw new HttpException({ message: '自定义异常信息', errorCode: 1001 }, HttpStatus.BAD_REQUEST)
  // }

  // @Get('exception/custom')
  // customException() {
  //   throw new ForbiddenException()
  // }



  @Get('number/:id')
  getNumber(@Param('id', ParseIntPipe) id: number) {
    return `the number is ${id}`
  }
}