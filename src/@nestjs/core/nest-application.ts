import path from 'path'
import { Logger } from './logger'
import express, { Express, NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import { defineModule,  } from '../common/module.decorator'
import { RequestMethod } from '../common/request.method.enum'
import { ArgumentsHost } from '../common/arguments-host.interface'
import { APP_FILTER } from './constants'
import {GlobalHttpExceptionFilter} from '../common/http-exception.filter'
import {INJECTED_TOKENS, DESIGN_PARAMTYPES} from '../common'

export class NestApplication {
  // 现在内部私有化一个Express实例
  private readonly app: Express = express()
  // 私有化一个providers数组,用于保存所有的providers
  // private readonly providers = new Map()

  // 保存所有的provider实例，key就是token，值就是类的实例或者值
  private readonly providerInstances = new Map()

  // 定义一个全局的提供者
  private readonly globalProviders = new Set()

  // 记录每个模块里有哪些provider的token
  private readonly moduleProviders = new Map()

  // 记录所有的中间件, 可能是中间件的类，也可能是中间件的实例，也可能是函数中间件
  private readonly middlewares = []
  // 记录所有的要排除的路径
  private readonly excludeRoutes = []
  // 存放默认的全局异常过滤器
  private readonly defaultGlobalHttpExceptionFilter = new GlobalHttpExceptionFilter()
  // 存放所有的全局异常过滤器
  private readonly globalHttpExceptionFilters = []

  constructor(protected readonly module) {
    // 使用express的中间件
    this.app.use(express.json()) // 用来把JSON格式的请求体对象放在req.body中
    this.app.use(express.urlencoded({ extended: true })) // 把form表单格式的请求体对象放在req.body中
    
  }

  // 全局异常过滤器
  useGlobalFilters(...filters) {
    // 过滤出类 的过滤器，给每个过滤器绑定所属模块元数据
    defineModule(this.module, filters.filter(it => it instanceof Function));
    this.globalHttpExceptionFilters.push(...filters)
  }

  // 中间件
  use(middleware) {
    this.app.use(middleware)
  }

  // 排除路径
  exclude(...routesInfo) {
    this.excludeRoutes.push(...routesInfo.map(this.normalizeRouteInfo))
    return this
  }

  private async initMiddlewares() {
    // 调用模块的configure方法，将应用实例传递给模块
    this.module.prototype.configure?.(this)
  }

  apply(...middleware) {
    // 将中间件定义到模块中
    defineModule(this.module, middleware)
    // 把收到的中间件放到middlewares数组中，并返回当前实例
    this.middlewares.push(...middleware)
    return this
  }
  getMiddlewareInstance(middleware) {
    // 如果middleware是一个类，就创建一个实例并返回
    if (middleware instanceof Function) {
      const dependencies = this.resolveDependencies(middleware)
      console.log(dependencies, '中间件的依赖')
      return new middleware(...dependencies)
    }
    return middleware
  }

  isExcluded(reqPath, method) {
    return this.excludeRoutes.some(routeInfo => {
      const { routePath, routeMethod } = routeInfo
      return reqPath === routePath && (method === routeMethod || routeMethod === RequestMethod.ALL)
    })
  }

  forRoutes(...routes) {
    // 遍历路径信息，为每个路径添加中间件
    for (const route of routes) {
      for (const middleware of this.middlewares) {
        // 把route格式化为标准对象，一个是路径，一个是请求方法
        const { routePath, routeMethod } = this.normalizeRouteInfo(route)
        // use 方法的第一个参数就表示匹配路径，如果路径不匹配根本就进入不了第二个回调参数
        this.app.use(routePath, (req, res, next) => {
          // 如果当前的路径要排除的话，就不走当前中间件了
          if (this.isExcluded(req.originalUrl, req.method)) {
            return next()
          }

          // 如果请求方法是ALL或者和路由配置的方法相同，才执行中间件
          if (routeMethod === RequestMethod.ALL || routeMethod === req.method) {
            // 此处的middleware可能是一个类，也可能是一个实例，也可能是一个函数
            if ('use' in middleware.prototype || 'use' in middleware) {
              const middlewareInstance = this.getMiddlewareInstance(middleware)
              middlewareInstance.use(req, res, next)
            } else if (middleware instanceof Function) {
              middleware(req, res, next)
            } else {
              next()
            }

          } else {
            next()
          }
        })
      }
    }
    // 注意每次清空
    this.middlewares.length = 0
    return this
  }
  private normalizeRouteInfo(route) {
    let routePath = ''
    let routeMethod = RequestMethod.ALL
    if (typeof route === 'string') {
      routePath = route
    } else if ('path' in route) { // route中有path属性
      routePath = route.path
      routeMethod = route.method ?? RequestMethod.ALL
    } else if (route instanceof Function) {
      // 如果是一个类的话，说明传入的时一个控制器，取他的前缀作为路径
      routePath = Reflect.getMetadata('prefix', route) || ''
    }
    routePath = path.posix.join('/', routePath)
    return {
      routePath,
      routeMethod
    }
  }

  // private initProviders() {
  //   // 取出注入模块中的所有的providers
  //   const providers = Reflect.getMetadata('providers', this.module) || []

  //   for (const provider of providers) {
  //     // 如果provider是一个类
  //     if (provider.provide && provider.useClass) { 
  //       const dependenceies = this.resolveDependencies(provider.useClass)
  //       // 创建类的实例
  //       const classInstance = new provider.useClass(...dependenceies)
  //       // 将类的实例保存到providers中
  //       this.providers.set(provider.provide, classInstance)
  //     } else if (provider.provide && provider.useValue) {
  //       // 提供的是一个值，则不需要容器帮助实例化
  //       this.providers.set(provider.provide, provider.useValue)
  //     } else if (provider.provide && provider.useFactory) {
  //       const inject = provider.inject ?? [] // 此处就是在model模块的useFactory写法中使用inject选项注入的参数
  //       // const injectedValues = inject.map(injectedToken => this.getProviderByToken(injectedToken))
  //       const injectedValues = inject.map(this.getProviderByToken.bind(this))
  //       // 提供的是一个工厂函数，此处的useFactory也可能会注入函数
  //       this.providers.set(provider.provide, provider.useFactory(...injectedValues))
  //     } else {
  //       // 表示只提供了一个类
  //       const dependenceies = this.resolveDependencies(provider)
  //       this.providers.set(provider, new provider(...dependenceies))
  //     }
  //   }

  //   // console.log(this.providers, 'providers===')
  // }



  // 实现了module模块的exports和imports之后重写 initProviders 方法
  private async initProviders() {
    // 获取当前模块导入的元数据 也就是module模块的imports数组
    const imports = Reflect.getMetadata('imports', this.module) ?? []
    // 遍历各个模块，取出每个模块的providers数组
    for (const importModule of imports) {
      let importedModule = importModule
      // 如果导入的模块是一个Promise，说明是异步的动态模块
      if (importModule instanceof Promise) {
        importedModule = await importedModule
      }

      // 如果导入的模块有module属性，说明是动态模块
      if ('module' in importedModule) {
        const { module, providers, exports, controllers } = importedModule

        const oldControllers = Reflect.getMetadata('controllers', module) ?? []
        const mergedControllers = [...oldControllers, ...(controllers ?? [])]
        defineModule(module, mergedControllers)

        const oldProviders = Reflect.getMetadata('providers', module) ?? []
        const mergedProviders = [...oldProviders, ...(providers ?? [])]
        defineModule(module, mergedProviders)
        console.log(mergedProviders, 'mergedProviders===', oldProviders)
        const oldExports = Reflect.getMetadata('exports', module) ?? []
        const mergedExports = [...oldExports, ...(exports ?? [])]
        defineModule(module, mergedExports)

        // 覆盖模块的providers和exports controllers
        Reflect.defineMetadata('controllers', mergedControllers, module)

        Reflect.defineMetadata('providers', mergedProviders, module)

        Reflect.defineMetadata('exports', mergedExports, module)


        this.registerProvidersFromModule(module, this.module)
      } else {
        // 注册导入模块的providers
        this.registerProvidersFromModule(importModule, this.module)
      }

    }

    // 获取当前模块自己的providers数组
    const moduleProviders = Reflect.getMetadata('providers', this.module) || []
    // 遍历模块中的providers数组，将每个provider保存到providers Map中
    for (const provider of moduleProviders) {
      this.addProvider(provider, this.module)
    }


  }
  // 参数module代表子模块，...parentModules代表父模块
  private registerProvidersFromModule(module, ...parentModules) {
    // 拿到当前模块是否是全局模块
    const global = Reflect.getMetadata('global', module)

    // 拿到导入的模块的providers数组，并经exports进行过滤,只保留exports中的provider
    const importedProviders = Reflect.getMetadata('providers', module) || []
    const exports = Reflect.getMetadata('exports', module) || []
    for (const exportToken of exports) {
      // exports中可以是module 或者providers的子集
      if (this.isModule(exportToken)) {
        // 递归调用，注册导入模块的providers
        this.registerProvidersFromModule(exportToken, module, ...parentModules)
      } else {
        const provider = importedProviders.find(p => p.provide === exportToken || p === exportToken)
        if (provider) {
          [module, ...parentModules].forEach((innerModule) => {
            this.addProvider(provider, innerModule, global)
          })

        }
      }

    }
    // 遍历每个模块的providers数组，将每个provider保存到providers Map中
    for (const provider of importedProviders) {
      this.addProvider(provider, module, global)
    }
    this.initController(module)
  }

  private isModule(token: any) {
    return token && token instanceof Function && Reflect.getMetadata('isModule', token)
  }


  // 原来的provider都混在一起了，现在需要分剋，每个模块有自己的providers
  private addProvider(provider, module, global = false) {
    // 此处的providers代表，module这个模块对应的provider的token
    const providers = global ? this.globalProviders : this.moduleProviders.get(module) || new Set()
    if(!global) {
      this.moduleProviders.set(module, providers)
    }

    const initToken = provider.provide ?? provider
    if (this.providerInstances.has(initToken)) {
      providers.add(initToken)
      return
    }



    // 此处判断用于避免循环依赖,如果providers中已经有了这个provider,则直接返回,避免无限循环
    // const initToken = provider.provide ?? provider
    // if (this.providerInstances.has(initToken)) return

    // 如果provider是一个类
    if (provider.provide && provider.useClass) {
      const Clazz = provider.useClass
      const dependenceies = this.resolveDependencies(Clazz)
      // 创建类的实例
      const value = new Clazz(...dependenceies)
      // 将类的实例保存到providers中
      this.providerInstances.set(provider.provide, value)
      // 把provider的token添加到module的providers Set中
      providers.add(provider.provide)
    } else if (provider.provide && provider.useValue) {
      // 提供的是一个值，则不需要容器帮助实例化
      this.providerInstances.set(provider.provide, provider.useValue)
      // 把provider的token添加到module的providers Set中
      providers.add(provider.provide)
    } else if (provider.provide && provider.useFactory) {
      const inject = provider.inject ?? [] // 此处就是在model模块的useFactory写法中使用inject选项注入的参数
      // const injectedValues = inject.map(injectedToken => this.getProviderByToken(injectedToken))
      const injectedValues = inject.map(this.getProviderByToken.bind(this))
      // 提供的是一个工厂函数，此处的useFactory也可能会注入函数
      this.providerInstances.set(provider.provide, provider.useFactory(...injectedValues))
      // 把provider的token添加到module的providers Set中
      providers.add(provider.provide)
    } else {
      // 表示只提供了一个类
      const dependenceies = this.resolveDependencies(provider)
      // 创建类的实例
      const value = new provider(...dependenceies)
      // 将类的实例保存到providers中
      this.providerInstances.set(provider, value)
      // 把provider的token添加到module的providers Set中
      providers.add(provider)
    }
  }

  // 通过token在特定的模块下找到对应的provider
  private getProviderByToken(injectedToken, module) {
    const global = Reflect.getMetadata('global', module)

    // 先找到此模块对应的injectedToken的Set，再判断此injectedToken是否在这个Set中
    if (this.moduleProviders.get(module)?.has(injectedToken) || this.globalProviders.has(injectedToken)) {
      return this.providerInstances.get(injectedToken)
    } else {
      return null
    }
  }

  private resolveDependencies(Clazz) {
    // 取出inject装饰器中注入的token数组
    const injectedTokens = Reflect.getMetadata(INJECTED_TOKENS, Clazz) || []
    // 取出构造函数的参数, design:paramtypes是ts内置的
    // 注意：要想从内置的DESIGN_PARAMTYPES中取出构造函数的参数，必须在tsconfig.json中开启emitDecoratorMetadata
    const constructorParams = Reflect.getMetadata(DESIGN_PARAMTYPES, Clazz) || []
    // console.log('injectedTokens====>>', injectedTokens)
    // console.log('constructorParams====>>', constructorParams)
    return constructorParams.map((param, index) => {
      const module = Reflect.getMetadata('nestModule', Clazz)
      // 把每个param中的token转换成对应的provider值
      // console.log(index, 'injectedTokens[index]', injectedTokens[index], 'param', param)
      // 如果injectedTokens[index]存在，则说明有@Inject装饰器，否则说明没有@Inject装饰器
      return this.getProviderByToken(injectedTokens[index] || param, module)
    })
  }

  // 初始化工作（重点）
  async initController(module) {
    // 取出模块中所有的控制器，然后做好路由配置
    const controlers = Reflect.getMetadata('controllers', module) || []
    // console.log(controlers, 'controllers====')
    Logger.log(`AppModule dependenceies initialzed`, 'InstanceLoader')
    // 循环处理控制器
    // 路由映射的核心是：什么样的请求方法什么样的路径对应的是哪个处理函数
    for (const Controller of controlers) {
      // 先拿到控制器上的参数,也就是解析出控制器的依赖
      const dependenceies = this.resolveDependencies(Controller)
      // 创建每个控制器的实例
      const controller = new Controller(...dependenceies)
      console.log(controller, 'controller===实例')
      // 获取控制器的路径前缀
      const prefix = Reflect.getMetadata('prefix', Controller) || '/'
      // 开始解析路由
      Logger.log(`${Controller.name} ${prefix}`, 'RouterResolver')
      // Reflect.getPrototypeOf(controller) 相当于 Controller.prototype
      // 循环拿到原型上自己的方法名
      const controllerPrototype = Controller.prototype
      // 获取控制器上绑定的过滤器数组
      const controllerFilters = Reflect.getMetadata('useFilters', Controller) ?? []
      // 给过滤器绑定所属模块元数据
      defineModule(this.module, controllerFilters);
      for (const methodName of Object.getOwnPropertyNames(controllerPrototype)) {
        // 从原型上拿到方法 即在AppController中定义的index方法
        const method = controllerPrototype[methodName]
        // 取得此函数上绑定的方法名的元数据 即在编写@Get装饰器时在其上定义的GET
        const httpMethod = Reflect.getMetadata('method', method)
        //  取得此函数上绑定的路径的元数据 即使用@Get()时在其中写入的info
        const pathMetadata = Reflect.getMetadata('path', method)
        // 取得函数上绑定的重定向路径的元数据
        const redirectUrl = Reflect.getMetadata('redirectUrl', method)
        const redirectStatusCode = Reflect.getMetadata('redirectStatusCode', method)
        // 取得此函数上绑定的状态码的元数据
        const httpStatusCode = Reflect.getMetadata('httpStatusCode', method)
        // 取得此函数上绑定的响应头的元数据
        const headers = Reflect.getMetadata('headers', method) || []
        // 获取方法上绑定的异常过滤器数组
        const methodFilters = Reflect.getMetadata('useFilters', method) ?? []
        defineModule(this.module, methodFilters);
        // 如果方法名不存在，则不处理
        if (!httpMethod) continue
        // 执行方法,即 this.app.get('/info', () => {})
        const routePath = path.posix.join('/', prefix, pathMetadata)
        console.log(routePath, 'routePath===')
        // 配置路由，当客户端 以httpMethod方法(即get还是post等方式)请求routePath路径时，会由对应的函数进行处理
        this.app[httpMethod.toLowerCase()](routePath, async(req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
            const host: ArgumentsHost = {
              switchToHttp: () => ({
                getRequest: () => req as any,
                getResponse: () => res as any,
                getNext: () => next as any,
              }),
            }
          try {
            console.log(req.url, 'req=====回调')
            // 执行方法时将参数拿过来
            const args = this.resolveParams(controller, methodName, req, res, next, host)
            // 执行方法
            const result = method.call(controller, ...args)
            // 如果返回结果有url属性，则重定向
            if (result?.url) {
              return res.redirect(result.statusCode || 302, result.url)
            }
            // 如果有重定向路径，则重定向
            if (redirectUrl) {
              return res.redirect(redirectStatusCode || 302, redirectUrl)
            }

            if (httpStatusCode) {
              res.statusCode = httpStatusCode
            } else if (httpMethod === 'POST') {
              res.statusCode = 201
            }

            // 判断controller的methodName方法上是否有Response或者Res参数装饰器，
            // 如果有，或者使用了Response或者Res参数装饰器且设置了passthrough为true，则会由Nestjs发送结果，
            // 否则不返回结果，由开发者自己处理
            const responseMetadata = this.getResponseMetadata(controller, methodName)
            if (!responseMetadata || responseMetadata?.data?.passthrough) {
              // 遍历请求头数组，将每个响应头设置到响应对象中
              headers.forEach(({ name, value }) => {
                res.setHeader(name, value)
              })
              // 返回结果
              res.send(result)
            }
          } catch (error) {
            await this.callExceptionFilters(error, host, methodFilters, controllerFilters)
          }


        })
        Logger.log(`Mapped {${routePath}, ${httpMethod}} route`, 'RoutesResolver')
      }
      Logger.log(`Nest application successfully started`, 'NestApplication')

    }
  }

  getFilterInstance(filter) {
    // 如果filter是一个类，就创建一个实例并返回
    if (filter instanceof Function) {
      const dependencies = this.resolveDependencies(filter)
      return new filter(...dependencies)
    }
    return filter
  }

  private callExceptionFilters(error, host: ArgumentsHost,  methodFilters, controllerFilters) {
    // 合并所有的过滤器，方法上的在前，控制器上的在后，用户配置的全局过滤器在后，默认的全局过滤器的顺序进行遍历，
    // 找到第一个能处理这个错误的过滤器进行处理就可以
    const allFilters = [...methodFilters, ...controllerFilters, ...this.globalHttpExceptionFilters, this.defaultGlobalHttpExceptionFilter]
    for (const filter of allFilters) {
      const filterInstance = this.getFilterInstance(filter)
      // 取出此异常过滤器关心的异常或者说要处理的异常
      const exceptions = Reflect.getMetadata('catch', filterInstance.constructor) ?? []
      // 如果没有配置catch元数据，说明是一个通用的异常过滤器，能处理所有异常，
      // 或者说当前的错误刚好就是配置的catch的exception类型或者是它的子类
      if (exceptions.length === 0 || exceptions.some(exception => error instanceof exception)) {
        filter.catch(error, host)
        break
      }
        
    }
  }

  private resolveParams(instance: any, methodName: string, req: ExpressRequest, res: ExpressResponse, next: NextFunction, host: ArgumentsHost) {
    // 获取参数的元数据 例子：拿到UserController实例上的handleRequest方法的参数
    const paramsMetadata = Reflect.getMetadata('params', instance, methodName) ?? []
    console.log(paramsMetadata, 'paramsMetadata==jo', instance, methodName)
    // 
    return paramsMetadata.map((paramMetadata) => {
      const { key, data, factory } = paramMetadata
      // switchToHttp是因为nestjs支持http、微服务、graphql等协议，不同协议下的请求对象不同，
      // 所以需要switchToHttp来切换到当前请求的协议下的请求对象
      // const ctx = {
      //   switchToHttp: () => ({
      //     getRequest: () => req,
      //     getResponse: () => res,
      //     getNext: () => next,
      //   }),
      // }

      switch (key) {
        case 'Request':
        case 'Req':
          return req
        case 'Query':
          return data ? req.query[data] : req.query
        case 'Headers':
          return data ? req.headers[data] : req.headers
        case 'Session':
          return data ? (req as any).session?.[data] : (req as any).session
        case 'Ip':
          return req.ip
        case 'Param':
          return data ? req.params[data] : req.params
        case 'Body':
          return data ? req.body[data] : req.body

        case 'Response':
        case 'Res':
          return res
        case 'Next':
          return next

        case 'DecoratorFactory':
          return factory(data, host)

        default:
          return null
      }
    })
  }

  private getResponseMetadata(controller: any, methodName: string) {
    const paramsMetadata = Reflect.getMetadata('params', controller, methodName) ?? []
    return paramsMetadata.filter(Boolean).find(param => ['Response', 'Res', 'Next'].includes(param.key))
  }

  private async initGlobalFilters() {
    const providers = Reflect.getMetadata('providers', this.module) || []
    for (const provider of providers) {
      if (provider.provide === APP_FILTER) {
        const providerInstance = this.getProviderByToken(APP_FILTER, this.module)
        this.useGlobalFilters(providerInstance)
      }

    }
  }

  // 启动http服务器
  async listen(port) {
    // 注册providers
    await this.initProviders()
    // 创建应用时初始化中间件
    await this.initMiddlewares()
    // 初始化全局异常过滤器
    await this.initGlobalFilters()
    // 初始化控制器
    await this.initController(this.module);
    // 调用express实例的listen方法，启动一个http服务，监听port端口
    this.app.listen(port, () => {
      Logger.log(`Application is runnning on http://localhost:${port}`, 'NestApplication')
    })
  }
}
