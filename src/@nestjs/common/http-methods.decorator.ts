import 'reflect-metadata'

export function Get(path:string=''): MethodDecorator {
  // target： AppController.prototype
  // propertyKey：方法名index
  // descriptor: index方法的属性描述
  return (target:any, propertyKey:string, descriptor:PropertyDescriptor) => {
    // 给descriptor.value 也就是index函数添加元数据，path=path
    Reflect.defineMetadata('path', path, descriptor.value)
    // 给descriptor.value 也就是index函数添加元数据，method=GET
    Reflect.defineMetadata('method', 'GET', descriptor.value)
  }
}

export function Post(path:string=''): MethodDecorator {
  // target： AppController.prototype
  // propertyKey：方法名index
  // descriptor: index方法的属性描述
  return (target:any, propertyKey:string, descriptor:PropertyDescriptor) => {
    // 
    Reflect.defineMetadata('path', path, descriptor.value)
    //
    Reflect.defineMetadata('method', 'POST', descriptor.value)
  }
}

export function Redirect(url:string='/', statusCode:number=302): MethodDecorator {
  
  return (target:any, propertyKey:string, descriptor:PropertyDescriptor) => {
   
    Reflect.defineMetadata('redirectUrl', url, descriptor.value)
   
    Reflect.defineMetadata('redirectStatusCode', statusCode, descriptor.value)
  }
}

export function HttpCode(statusCode:number=200): MethodDecorator {
  
  return (target:any, propertyKey:string, descriptor:PropertyDescriptor) => {
   
   
    Reflect.defineMetadata('httpStatusCode', statusCode, descriptor.value)
  }
}

export function Header(name: string, value: string): MethodDecorator {
  
  return (target:any, propertyKey:string, descriptor:PropertyDescriptor) => {

    // 响应头键值对会有多个，所以需要数组存储
   const existingHeaders = Reflect.getMetadata('headers', target, propertyKey)??[]
    // key就是装饰器名字
    existingHeaders.push({name, value})
    // 将headers数组存储到元数据中
    Reflect.defineMetadata('headers', existingHeaders, descriptor.value)
  }
}