import { ArgumentsHost } from "./arguments-host.interface"
import { ExceptionFilter } from "./exception-filter.interface"
import { HttpException } from "./http-exception"
import { Response } from "express"

export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    if (exception instanceof HttpException) {
      const responseEx: any = exception.getResponse()
      const status:any = exception.getStatus()
      if (typeof responseEx === 'string') {
        response.status(status).json({
          statusCode: status,
          message: responseEx
        })
      } else {
        response.status(status).json(responseEx)
      }
    } else {
      // 未识别的异常
      return response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      })
    }
  }
}