
import { Body } from "@nestjs/common";
import { Controller, Get,Post, Req, Request, Response, Query, Headers, Session, Ip, Param,  } from "@nestjs/common";
import {Request as ExpressRequest, Response as ExpressResponse} from 'express'
import { User } from "./user.decorator";

@Controller('users')
export class UserController{

  // 参数装饰器的参数执行是从右到左
  @Get('req')
  handleRequest(@Req() req: ExpressRequest, age:number, @Request() request: ExpressRequest) {
    // console.log(req.url, '-=-=-=-')
    // console.log(age, 'age===')
    // console.log(request.method, 'method===')
    return 'handleRequest'
  }


  @Get('query')
  handleQuery(@Query() query:any, @Query('id') id:string) {
    // console.log(query, 'query===')
    // console.log(id, 'id===')
    return 'handleQery'
  }

  @Get('headers')
  handleHeaders(@Headers() headers:any, @Headers('accept') accept:string) {
    // console.log(headers, 'headers===')
    // console.log(accept, 'accept===')
    return 'handleHeaders'
  }

  @Get('session')
  handleSession(@Session() session:any, @Session('pageView') pageView:string) {
    console.log(session, 'session===')
    console.log(pageView, 'pageView===')
    if (session.pageView) {
      session.pageView++
    } else {
      session.pageView = 1
    }
    return `pageView: ${session.pageView}`
  }


  @Get('ip')
  handleIp(@Ip() ip:any) {
    console.log(ip, 'ip===')
    return 'handleIp'
  }

  @Get(':username/info/:age')
  getUserNameInfo(@Param() params:any, @Param('username') username:string) {
    console.log(params, 'param===')
    console.log(username, 'username===')
    return 'getUserNameInfo'
  }

  @Post('create')
  createUser(@Body() createUserDto:any, @Body('username') username:string) {
    console.log(createUserDto, 'createUserDto===')
    console.log(username, 'username===')
    return 'createUser'
  }


  @Get('response')
  response(@Response() res: ExpressResponse) {
    console.log(res, 'res===')
    res.send('response')
    res.json({
      code: 200,
      msg: 'success',
     
    })
    // return 'response'
  }


  @Get('customed')
  customedDecoratorUser(@User() user:any, @User('name') name:string ) {
    console.log(user, 'user===')
    console.log(name, 'name===')
    return 'getUser'
  }

}

