import { HttpClient } from './client';
import { DefaultConfig, DefaultInterceptor, HttpInterceptor } from './interceptor';
import { HttpInterceptingHandler } from './handler';
import { HttpXsrfInterceptor } from './xsrf';
import { JsonpInterceptor } from './jsonp';


export class Rjax extends HttpClient {
    private config: DefaultConfig = {
        baseURL: '',
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        headers: {},
        withCredentials: false,
        jsonp: false,
    };
    constructor(config?: DefaultConfig) {
        super();
        if (config) {
            this.config = {...this.config, ...config};
            const interceptors: HttpInterceptor[] = [new DefaultInterceptor(config), new HttpXsrfInterceptor(config.xsrfHeaderName, config.xsrfCookieName)];
            if (config.jsonp) {
                interceptors.push(new JsonpInterceptor());
            }
            if (config.interceptors && config.interceptors instanceof Array && config.interceptors.length) {
                interceptors.push(...config.interceptors);
            }
            this.handler = new HttpInterceptingHandler(interceptors);
        }
    }
}