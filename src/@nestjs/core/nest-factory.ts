
import { NestApplication } from './nest-application'
import {Logger} from './logger'

export class NestFactory {
  static async create(AppModule) {
    Logger.log('Starting Nest application...', 'NestFactory')

    const app = new NestApplication(AppModule)
    return app
  }
}