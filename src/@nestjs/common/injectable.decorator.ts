import 'reflect-metadata'

export function Injectable(): ClassDecorator {
  return (target: Function) => {
    // 给类添加元数据 target就是LoggerService，元数据的key是injectable，值是true
    Reflect.defineMetadata('injectable', true,target)
  }
}
