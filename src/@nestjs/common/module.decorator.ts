import 'reflect-metadata'

interface ModuleMetadata {
  controllers?: Function[],
  providers?: any[],
  exports?: any[],
  imports?: any[],
}

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    // 当一个类使用Module装饰器时，给它添加一个isModule元数据，值为true
    Reflect.defineMetadata('isModule', true, target)
    // 给模块的controllers添加nestModule元数据，值为该模块，作为标记，表示该controllers属于具体的哪个模块
    defineModule(target, metadata.controllers)
    // 给模块类添加元数据 target就是AppModule，元数据的名字叫controllers，值是controllers数组[AppController]
    Reflect.defineMetadata('controllers', metadata.controllers,target)

    // 给模块的providers添加nestModule元数据，值为该模块，作为标记，表示该providers属于具体的哪个模块
    // provider.useClass有可能会不存在，所以此处先注释掉
    // const providers = (metadata.providers)?.map(provider => provider.useClass).filter(Boolean) ?? []
    // defineModule(target, providers)
    // console.log(providers, 'providers====', metadata.providers)
    defineModule(target, metadata.providers)
    // 给模块类添加元数据 target就是AppModule，元数据的key是providers，值是providers数组[LoggerService]
    Reflect.defineMetadata('providers', metadata.providers,target)
    // 给模块类添加元数据 target就是AppModule，元数据的key是exports，值是exports数组[LoggerService]
    Reflect.defineMetadata('exports', metadata.exports,target)
    // 给模块类添加元数据 target就是AppModule，元数据的key是imports，值是imports数组[LoggerModule]
    Reflect.defineMetadata('imports', metadata.imports,target)

  }
}

export function defineModule(nestModule, targets=[]) {
  targets?.forEach(target => {
    if (target instanceof Function) {
      Reflect.defineMetadata('nestModule', nestModule, target)
    }
  })
}

export function Global() {
  // 标明该@Module修饰的类是全局模块
  return (target: Function) => {
    Reflect.defineMetadata('global', true, target)
  }
}

export interface DynamicModule extends ModuleMetadata {
  module: Function,
}