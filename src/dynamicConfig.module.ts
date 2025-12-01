import { Module, DynamicModule } from "@nestjs/common";

@Module({
  providers: [
    {
      provide: 'PREFIX',
      useValue: 'prefix'
    }
  ],
  exports: ['PREFIX'],
})
export class DynamicConfigModule {
  static forRoot(options?: any): DynamicModule | Promise<DynamicModule> {
    const providers = [
      {
        provide: 'CONFIG',
        useValue: {apiKey: options},
      }
    ]
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          module: DynamicConfigModule,
          providers,
          controllers: [],
          exports: providers.map(provider => provider instanceof Function ? provider : provider.provide),
        })
      }, 3000)
    })
    // return {
    //   module: DynamicConfigModule,
    //   providers,
    //   controllers: [],
    //   exports: providers.map(provider => provider instanceof Function ? provider : provider.provide),
    // };
  }
}