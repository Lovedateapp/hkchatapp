// Cloudflare D1类型定义

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

interface PreparedStatement {
  bind(...values: any[]): PreparedStatement;
  first<T = unknown>(column?: string): Promise<T>;
  run<T = unknown>(): Promise<D1ExecResult>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

declare global {
  interface D1Database {
    prepare(query: string): PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: PreparedStatement[]): Promise<D1Result<T>[]>;
    exec<T = unknown>(query: string): Promise<D1ExecResult>;
  }
  
  interface PagesFunction<Env = unknown, Params extends string = any, Data = unknown> {
    (context: EventContext<Env, Params, Data>): Response | Promise<Response>;
  }
  
  interface EventContext<Env, Params extends string, Data> {
    request: Request;
    env: Env;
    params: Record<Params, string>;
    data: Data;
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
    next(input?: Request | string, init?: RequestInit): Promise<Response>;
  }
}
