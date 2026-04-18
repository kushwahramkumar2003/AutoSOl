declare module "ioredis" {
  export default class Redis {
    constructor(url: string);
    ping(): Promise<string>;
    call(command: string, ...args: string[]): Promise<unknown>;
    disconnect(): void;
  }
}
