import 'reflect-metadata'
import { INJECTED_TOKENS } from './contants';


export function Inject(token: string): ParameterDecorator {
  // 
  return (target: any, propertyKey: string, parameterIndex: number) => {
    // 从元数据中获取已注入的token数组
    const exsitingInjectedTokens = Reflect.getMetadata(INJECTED_TOKENS, target) || []
    exsitingInjectedTokens[parameterIndex] = token;
    console.log('exsitingInjectedTokens====>>', exsitingInjectedTokens)
    // 将token数组保存在target的元数据上
    Reflect.defineMetadata(INJECTED_TOKENS, exsitingInjectedTokens, target)
  }
}

