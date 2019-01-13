# 快速上手

## 安装
```bash
yarn add rjax # 或者：npm install rjax --save
```

## 使用
```js
import { Rjax } from 'rjax';

// 创建实例
const rjax = new Rjax({
  baseURL: 'https://some-domain.com/api/', // 设置请求基路径，可选
  timeout: 1000, // 设置请求超时时间，可选
  interceptors: [] // 设置请求响应拦截器，可设置多组，可选
  xsrfCookieName: 'XSRF-TOKEN', // 是用作 xsrf token 的值的cookie的名称，默认'XSRF-TOKEN'，可选
  xsrfHeaderName: 'X-XSRF-TOKEN', // 是承载 xsrf token 的值的 HTTP 头的名称，默认'X-XSRF-TOKEN'，可选
  headers: {}, // 添加统一的headers，默认{}，可选
  withCredentials: false, // 表示跨域请求时是否需要使用凭证，默认false，可选
  jsonp: false, // 是否添加jsonp请求功能，默认false，可选
});

// 发起GET请求
rjax.get(`/user/12345`).subscribe(response => {
    // 请求成功回调
    console.log(response);
}, error => {
    // 请求失败回调
    console.log(error);
});
```
### 以下是可用的实例方法
```ts
class HttpClient {
  request(first: string | HttpRequest<any>, url?: string, options: { body?: any; headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | ... 2 more ... | "json"; withCredentials?: boolean; } = {}): Observable<any>
  delete(url: string, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
  get(url: string, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
  head(url: string, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
  jsonp<T>(url: string, callbackParam: string): Observable<T>
  options(url: string, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
  patch(url: string, body: any, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
  post(url: string, body: any, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
  put(url: string, body: any, options: { headers?: HttpHeaders | { [header: string]: string | string[]; }; observe?: HttpObserve; params?: HttpParams | { [param: string]: string | string[]; }; reportProgress?: boolean; responseType?: "arraybuffer" | "blob" | "text" | "json"; withCredentials?: boolean; } = {}): Observable<any>
}
```