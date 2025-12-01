import { Injectable } from "@nestjs/common";


@Injectable()
export class LoggerClassService {
  log(msg: string) {
    console.log('LoggerClassService', msg)
  }
}
@Injectable()
export class LoggerService {
  log(msg: string) {
    console.log('LoggerService', msg)
  }
}

@Injectable()
export class UseValueService {
  log(msg: string) {
    console.log('UseValueService', msg)
  }
}

@Injectable()
export class UserFactoryService {
  log(msg: string) {
    console.log('UserFactoryService', msg)
  }
}
