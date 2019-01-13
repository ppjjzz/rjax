import { HttpHandler, HttpBackend } from './backend';
import { Observable } from 'rxjs';
import { HttpRequest } from './request';
import { HttpInterceptorHandler, HttpInterceptor, NoopInterceptor } from './interceptor';
import { HttpEvent } from './response';
import { HttpXhrBackend } from './xhr';

export class HttpInterceptingHandler implements HttpHandler {
    private chain: HttpHandler|null = null;
    private backend: HttpBackend = new HttpXhrBackend();
    constructor(private interceptors: HttpInterceptor[] = [new NoopInterceptor()]) {}
  
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
      if (this.chain === null) {
        this.chain = this.interceptors.reduceRight(
            (next, interceptor) => new HttpInterceptorHandler(next, interceptor), this.backend);
      }
      return this.chain.handle(req);
    }
  }
  
  /**
   * Constructs an `HttpHandler` that applies interceptors
   * to a request before passing it to the given `HttpBackend`.
   *
   * Use as a factory function within `HttpClientModule`.
   *
   *
   */
  export function interceptingHandler(
      backend: HttpBackend, interceptors: HttpInterceptor[] | null = []): HttpHandler {
    if (!interceptors) {
      return backend;
    }
    return interceptors.reduceRight(
        (next, interceptor) => new HttpInterceptorHandler(next, interceptor), backend);
  }
  
  /**
   * Factory function that determines where to store JSONP callbacks.
   *
   * Ordinarily JSONP callbacks are stored on the `window` object, but this may not exist
   * in test environments. In that case, callbacks are stored on an anonymous object instead.
   *
   *
   */
  export function jsonpCallbackContext(): Object {
    if (typeof window === 'object') {
      return window;
    }
    return {};
  }