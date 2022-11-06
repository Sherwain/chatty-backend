import { config } from "@root/config";

const log = config.LOG.getInstance("server");

export class Helpers {
  static firstLetterUppercase(str: string): string {
    const valueString = str.toLowerCase();
    return valueString
      .split(" ")
      .map((value: string) => ``)
      .join(" ");
  }

  static generateRandomIntegers(): number {
    const largeNumber = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
    return largeNumber;
  }

  static parseJSON(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
}
