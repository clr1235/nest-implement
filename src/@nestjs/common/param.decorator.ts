import 'reflect-metadata'

export const createParamDecorator = (keyOrFactory:string | Function) => {
  // target: 控制器原型
  // propertyKey: 方法名 handleRequest
  // parameterIndex: 索引,先走1再走0
  return (data?:any) => (target:any, propertyKey:string, parameterIndex:number) => {
    // console.log(target, propertyKey, parameterIndex)
    // 给控制器类的原型的propertyKey也就是handleRequest方法的属性上添加元数据
    // 属性名为params,handleRequest的属性值是一个数组
    // console.log(target, 'target===参数装饰器', propertyKey)
    const existingParameters = Reflect.getMetadata('params', target, propertyKey)??[]
    if (typeof keyOrFactory === 'function') {
      // 如果传过来的是函数，则key写死为DecoratorFactory，factory为传过来的函数，
      existingParameters[parameterIndex] = {parameterIndex, key: 'DecoratorFactory', factory: keyOrFactory, data}
    } else {
      // key就是装饰器名字
      existingParameters[parameterIndex] = {parameterIndex, key: keyOrFactory, data}
    }
    
    
    // console.log(existingParameters, 'existingParameters===', key, data)
    Reflect.defineMetadata(`params`, existingParameters, target, propertyKey)

  }
}
export const Request = createParamDecorator('Request')
export const Req = createParamDecorator('Req')
export const Query = createParamDecorator('Query')
export const Headers = createParamDecorator('Headers')
export const Session = createParamDecorator('Session')
export const Ip = createParamDecorator('Ip')
export const Param = createParamDecorator('Param')
export const Body = createParamDecorator('Body')

export const Response = createParamDecorator('Response')
export const Res = createParamDecorator('Res')
export const Next = createParamDecorator('Next')