import 'reflect-metadata'

export function Catch(...exceptionTypes: Function[]): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata('catch', exceptionTypes, target)
  }
}