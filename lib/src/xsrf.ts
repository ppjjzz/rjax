/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Observable} from 'rxjs';
import {parseCookieValue} from './cookie';
import {HttpHandler} from './backend';
import {HttpInterceptor} from './interceptor';
import {HttpRequest} from './request';
import {HttpEvent} from './response';


/**
 * Retrieves the current XSRF token to use with the next outgoing request.
 *
 * @publicApi
 */
export abstract class HttpXsrfTokenExtractor {
  /**
   * Get the XSRF token to use with an outgoing request.
   *
   * Will be called for every request, so the token may change between requests.
   */
  abstract getToken(): string|null;
}

/**
 * `HttpXsrfTokenExtractor` which retrieves the token from a cookie.
 */
export class HttpXsrfCookieExtractor implements HttpXsrfTokenExtractor {
  private lastCookieString: string = '';
  private lastToken: string|null = null;
  private doc = document;
  /**
   * @internal for testing
   */
  parseCount: number = 0;

  constructor(private cookieName: string) {}

  getToken(): string|null {
    if (typeof window === 'undefined' &&
    typeof document === 'undefined') {
      return null;
    }
    const cookieString = this.doc.cookie || '';
    if (cookieString !== this.lastCookieString) {
      this.parseCount++;
      this.lastToken = parseCookieValue(cookieString, this.cookieName);
      this.lastCookieString = cookieString;
    }
    return this.lastToken;
  }
}

/**
 * `HttpInterceptor` which adds an XSRF token to eligible outgoing requests.
 */
export class HttpXsrfInterceptor implements HttpInterceptor {
  private tokenService!: HttpXsrfTokenExtractor;
  constructor(private headerName: string, private cookieName: string) {
    this.tokenService = new HttpXsrfCookieExtractor(this.cookieName);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const lcUrl = req.url.toLowerCase();
    // Skip both non-mutating requests and absolute URLs.
    // Non-mutating requests don't require a token, and absolute URLs require special handling
    // anyway as the cookie set
    // on our origin is not the same as the token expected by another origin.
    if (req.method === 'GET' || req.method === 'HEAD' || lcUrl.startsWith('http://') ||
        lcUrl.startsWith('https://')) {
      return next.handle(req);
    }
    const token = this.tokenService.getToken();

    // Be careful not to overwrite an existing header of the same name.
    if (token !== null && !req.headers.has(this.headerName)) {
      req = req.clone({headers: req.headers.set(this.headerName, token)});
    }
    return next.handle(req);
  }
}
