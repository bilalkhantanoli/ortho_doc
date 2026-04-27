export interface DenoRuntime {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (
    handler: (request: Request) => Response | Promise<Response>,
  ) => void;
}
