import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  constructor(
    @Inject('CONFIG') private config: any,
    @Inject('PREFIX') private prefix: string,
  ) {}
  getConfig() {
    // console.log(this.prefix)
    return this.prefix + this.config.apiKey;
  }
}