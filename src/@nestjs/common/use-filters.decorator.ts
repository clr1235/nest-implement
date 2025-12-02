import 'reflect-metadata'
import { ExceptionFilter } from './exception-filter.interface';

export function UseFilters(...filters: ExceptionFilter[]): ClassDecorator & MethodDecorator {
  return (target: object| Function, propertyKey?: string| symbol, descriptor?: TypedPropertyDescriptor<any>) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata('useFilters', filters, descriptor.value);
    } else {
      // Class decorato
      Reflect.defineMetadata('useFilters', filters, target);
    }
  }
}
