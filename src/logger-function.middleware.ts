import { Request, Response, NextFunction } from "express"

export function LoggerFunctionMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('LoggerFunctionMiddleware')
  next()
}