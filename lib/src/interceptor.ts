/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Observable} from 'rxjs';

import {HttpHandler} from './backend';
import {HttpRequest} from './request';
import {HttpEvent} from './response';
import { HttpHeaders } from './headers';
import { timeout } from 'rxjs/operators';

export interface DefaultConfig {
  baseURL: string;
  timeout: number;
  xsrfCookieName: string;
  xsrfHeaderName: string;
  withCredentials: boolean;
  headers: {[header: string]: string | string[]};
  jsonp: boolean;
  interceptors?: HttpInterceptor[];
}

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
function combineURLs(baseURL: string, relativeURL: string) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
function isAbsoluteURL(url: string) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
}

/**
 * Intercepts `HttpRequest` and handles them.
 *
 * Most interceptors will transform the outgoing request before passing it to the
 * next interceptor in the chain, by calling `next.handle(transformedReq)`.
 *
 * In rare cases, interceptors may wish to completely handle a request themselves,
 * and not delegate to the remainder of the chain. This behavior is allowed.
 *
 * @publicApi
 */
export interface HttpInterceptor {
  /**
   * Intercept an outgoing `HttpRequest` and optionally transform it or the
   * response.
   *
   * Typically an interceptor will transform the outgoing request before returning
   * `next.handle(transformedReq)`. An interceptor may choose to transform the
   * response event stream as well, by applying additional Rx operators on the stream
   * returned by `next.handle()`.
   *
   * More rarely, an interceptor may choose to completely handle the request itself,
   * and compose a new event stream instead of invoking `next.handle()`. This is
   * acceptable behavior, but keep in mind further interceptors will be skipped entirely.
   *
   * It is also rare but valid for an interceptor to return multiple responses on the
   * event stream for a single request.
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}

/**
 * `HttpHandler` which applies an `HttpInterceptor` to an `HttpRequest`.
 *
 *
 */
export class HttpInterceptorHandler implements HttpHandler {
  constructor(private next: HttpHandler, private interceptor: HttpInterceptor) {}

  handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    return this.interceptor.intercept(req, this.next);
  }
}

/**
 * A multi-provider token which represents the array of `HttpInterceptor`s that
 * are registered.
 *
 * @publicApi
 */

export class NoopInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req);
  }
}

export class DefaultInterceptor implements HttpInterceptor {
  constructor(private config: DefaultConfig) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let headers!: HttpHeaders;
    if (typeof this.config.headers === 'object') {
      for (const key in this.config.headers) {
        if (this.config.headers.hasOwnProperty(key)) {
          headers = req.headers.set(key, this.config.headers[key]);  
        }
      }
    }
    let url = req.url;
    // Support baseURL config
    if (this.config.baseURL && !isAbsoluteURL(url)) {
      url = combineURLs(this.config.baseURL, url);
    }
    const defaultReq = req.clone({
      url,
      headers,
      withCredentials: this.config.withCredentials
    });
    if (Number(this.config.timeout) > 0) {
      return next.handle(defaultReq).pipe(timeout(this.config.timeout));
    }
    return next.handle(defaultReq);
  }
}