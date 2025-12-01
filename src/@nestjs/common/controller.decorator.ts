import 'reflect-metadata'

interface ControllerOptions{
  prefix?: string
}

// 函数重载
// path前缀可以为空/空串/非空串/对象
export function Controller():ClassDecorator
export function Controller(prefix:string):ClassDecorator
export function Controller(options:ControllerOptions): ClassDecorator
export function Controller(prefixOrOptions?:string|ControllerOptions):ClassDecorator {
  let options:ControllerOptions = {}
  if (typeof prefixOrOptions === 'string') {
      options.prefix = prefixOrOptions
  } else if (typeof prefixOrOptions === 'object') {
      options = prefixOrOptions
  }
  // 这是一个类装饰器，装装饰的是控制器这个类
  return (target: Function) => {
    // 给控制器类添加prefix路径前缀的元数据
    Reflect.defineMetadata('prefix', options.prefix || '', target)
  }
}