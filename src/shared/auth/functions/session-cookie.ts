import { Response } from 'express';

export interface SessionCookieConfig {
  cookieName: string;
  cookieDomain?: string;
  cookieMaxAge?: number;
  secureCookie: boolean;
}

export interface SessionCookie {
  set(res: Response, token: string): void;
  clear(res: Response): void;
}

export const createSessionCookie = (config: SessionCookieConfig): SessionCookie => {
  const base = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    domain: config.cookieDomain,
    secure: config.secureCookie,
  } as const;

  return {
    set(res, token) {
      res.cookie(config.cookieName, token, {
        ...base,
        ...(config.cookieMaxAge !== undefined ? { maxAge: config.cookieMaxAge } : {}),
      });
    },

    clear(res) {
      res.cookie(config.cookieName, 'invalid', { ...base, maxAge: -1 });
    },
  };
};
