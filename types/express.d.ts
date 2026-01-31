import { Request } from 'express';

declare global {
  namespace Express {
    interface AuthInfo {
      userId: string;
      has: (permission: any) => boolean;
      getToken?: () => Promise<any>;
      sessionClaims?: Record<string, any> | undefined;
    }

    interface Request {
      auth: () => AuthInfo;
      plan?: string;
      file: any;
    }
  }
}
