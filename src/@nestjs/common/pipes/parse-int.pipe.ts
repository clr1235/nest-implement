import { BadRequestException } from "../http-exception";
import { PipeTransform } from "../pipe-transform.interface";


export class ParseIntPipe implements PipeTransform {
  transform(value: any) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed (numeric string is expected)')
    }
    return val;
  }
}