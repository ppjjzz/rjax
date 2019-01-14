# 使用示例

## 并发请求

并发多个请求，等待所有请求都结束后才执行回调相当于 **Promise.all()**

```js
import { Rjax } from 'rjax';
import { combineLatest } from 'rxjs';

// 创建实例
const rjax = new Rjax();

const p1$ = rjax.get(`/user/12345`);
const p2$ = rjax.get(`/user/123456`);

combineLatest(p1$, p2$).subscribe(([res1, res2]) => {
    // 请求成功回调
    console.log(res1); // p1$ 的请求结果
    console.log(res2); // p2$ 的请求结果
}, error => {
    // 请求失败回调
    console.log(error);
});
```

## 多数据源合并

例如某个图表的数据来源于websocket和ajax手动请求，返回格式是一样的，可以将这两个数据流进行合并创建新的Observable，组件只要订阅合并后的数据流而不关心数据的来源

```js
import { Rjax } from 'rjax';
import { merge } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

const rjax = new Rjax();

const ws$ = webSocket('wss://echo.websocket.org'); // websocket
const ajax$ = rjax.get(`/user/12345`); // ajax

// 合并数据流
merge(ws$, ajax$).subscribe(res => {
    console.log(res)
}, err => console.log('请求出错'));
```

