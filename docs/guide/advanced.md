# 进阶

## 拦截请求和响应
使用拦截机制，你可以声明一些拦截器，用它们监视和转换从应用发送到服务器的 HTTP 请求。 拦截器还可以用监视和转换从服务器返回到本应用的那些响应。 多个选择器会构成一个“请求/响应处理器”的双向链表。  

拦截器可以用一种常规的、标准的方式对每一次 HTTP 的请求/响应任务执行从认证到记日志等很多种隐式任务。  

如果没有拦截机制，那么开发人员将不得不对每次 HttpClient 调用显式实现这些任务。

### 编写拦截器
要实现拦截器，就要实现一个实现了 HttpInterceptor 接口中的 intercept() 方法的类。

```js
import { HttpResponse } from 'rjax';
import { Observable ,  throwError as _throw } from 'rxjs';
import { tap, mergeMap, finalize, catchError } from 'rxjs/operators';
import { Rjax } from 'rjax';

class CustomInterceptor {
    intercept(req, next) {
        console.log('拦截请求');
        // 一定要用clone的方法进行拦截修改，为了保持请求的不可变性！！！！
        const newReq = req.clone({
            url: req.url.replace('http://', 'https://'), // 修改请求的url
            body: {...req.body, name: req.body.name.trim()} // 修改请求体
            headers: req.headers.set('Authorization', 'authToken'), // 添加请求头
        });
        return next.handle(newReq).pipe(
            tap(x => console.log('拦截响应', x)),
            , mergeMap(event => {
                // 这里可根据后台接口约定自行判断
                if (event instanceof HttpResponse && (event.status !== 200 || !event.body.success)) {
                return Observable.create(observer => observer.error(event));
                }
                return Observable.create(observer => observer.next(event));
            })
            , catchError(res => {
                switch (res.status) {
                case 401:
                    // 拦截到401错误
                    break;
                case 200:
                    // 业务层级错误处理
                    break;
                case 404:

                    break;
                case 500:

                    break;
                default:

                    break;
                }
                return _throw(res); // 将错误信息抛给下个拦截器或者请求调用方
            }), finalize(() => {
                // 无论成功或者失败都会执行
                // 可以记录日志等等
            }
            )
        );
    }
}

// 创建实例
const rjax = new Rjax({
  interceptors: [new CustomInterceptor()] // 设置请求响应拦截器，可设置多组
});
```

### 拦截器的顺序
Rjax 会按照你提供它们的顺序应用这些拦截器。 如果你提供拦截器的顺序是先 A，再 B，再 C，那么请求阶段的执行顺序就是 A->B->C，而响应阶段的执行顺序则是 C->B->A。  

以后你就再也不能修改这些顺序或移除某些拦截器了。 如果你需要动态启用或禁用某个拦截器，那就要在那个拦截器中自行实现这个功能。

## 请求的防抖（debounce）
当用户在搜索框中输入名字时进行远程检索  

如果每次击键都发送一次请求就太昂贵了。 最好能等到用户停止输入时才发送请求。 使用 RxJS 的操作符就能轻易实现它，参见下面的代码片段：  
```jsx
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Rjax } from 'rjax';
export default class InputSearch extends Component {
    subject$ = new Subject();
    state = {
        data: []
    };
    rjax = new Rjax();
    componentDidMount() {
        this.subjectRef = this.subject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap(name => this.rjax.get(`/user`, {params: name})).subscribe(res => {
                this.setState({
                    data: res
                });
            }, err => console.log('请求出错'));
        );
    }
    componentWillUnmount() {
        // 组件卸载时取消订阅
        this.subjectRef.unsubscribe();
    }
    search = ({target: value}) => {
        this.subject.next({name: value});
    }
    render() {
        const {data} = this.state;
        return (
            <div>
                <input type="text" onChange={this.search} />
                <ul>
                    {data.map(item => <li key={item}>{item}</li>)}
                </ul>
            </div>
        );
    }
}
```

除了把每个 input 的值都直接转发给 `/user` 请求 componentDidMount() 中的代码还通过下列三个操作符对这些搜索值进行管道处理：  
1. debounceTime(500) - 等待，直到用户停止输入（这个例子中是停止 1/2 秒）。
2. distinctUntilChanged() - 等待，直到搜索内容发生了变化。
3. switchMap() - 把搜索请求发送给rjax。

这样，只有当用户停止了输入且搜索值和以前不一样的时候，搜索值才会传给rjax发起请求。

### switchMap()
这个 switchMap() 操作符有三个重要的特征：
1. 它的参数是一个返回 Observable 的函数。rjax.get() 会返回 Observable，其它请求方法也一样。
2. 如果以前的搜索结果仍然是在途状态（这会出现在慢速网络中），它会取消那个请求，并发起这个新的搜索。
3. 它会按照原始的请求顺序返回这些服务的响应，而不用关心服务器实际上是以乱序返回的它们。

## 配置请求
待发送请求的option可以通过传给 Rjax 方法最后一个参数中的配置对象进行配置。

### 添加请求头
很多服务器在进行保存型操作时需要额外的请求头。 比如，它们可能需要一个 Content-Type 头来显式定义请求体的 MIME 类型。 也可能服务器会需要一个认证用的令牌（token）。

```js
import { HttpHeaders } from 'rjax';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
    'Authorization': 'my-auth-token'
  })
};

rjax.post(`/user`,{name: 'xxxx'}, httpOptions)
.subscribe(res => {
    console.log(res)
}, err => console.log('请求出错'));
```

### 修改请求头
你没法直接修改前述配置对象中的现有头，因为这个 HttpHeaders 类的实例是不可变的。  

改用 set() 方法代替。 它会返回当前实例的一份克隆，其中应用了这些新修改。  

比如在发起下一个请求之前，如果旧的令牌已经过期了，你可能还要修改认证头。  

```js
httpOptions.headers =
  httpOptions.headers.set('Authorization', 'my-new-auth-token');
```

### URL参数

添加 URL 搜索参数也与此类似。  

```js
import { HttpParams } from 'rjax';

searchUsers(name) {
  name = name.trim();

  const options = term ?
   { params: new HttpParams().set('name', name) } : {};

  return this.rjax.get(`/user`, options)
    .pipe(
      catchError(this.handleError('searchUsers', []))
    );
}
```

HttpParams 是不可变的，所以你也要使用 set() 方法来修改这些选项。

## 错误处理

如果这个请求导致了服务器错误怎么办？甚至，在烂网络下请求都没到服务器该怎么办？Rjax 就会返回一个错误（error）而不再是成功的响应。  

通过在 .subscribe() 中添加第二个回调函数，你可以在组件中处理它：

```js
showConfig() {
  this.configService.getConfig()
    .subscribe(
      (data: Config) => this.config = { ...data }, // success path
      error => this.error = error // error path
    );
}
```

在数据访问失败时给用户一些反馈，确实是个好主意。 不过，直接显示由 Rjax 返回的原始错误数据还远远不够。  

###  获取错误详情

检测错误的发生是第一步，不过如果知道具体发生了什么错误才会更有用。上面例子中传给回调函数的 err 参数的类型是 HttpErrorResponse，它包含了这个错误中一些很有用的信息。  

可能发生的错误分为两种。如果后端返回了一个失败的返回码（如 404、500 等），它会返回一个错误响应体。  

或者，如果在客户端这边出了错误（比如在 RxJS 操作符 (operator) 中抛出的异常或某些阻碍完成这个请求的网络错误），就会抛出一个 Error 类型的异常。  

Rjax 会在 HttpErrorResponse 中捕获所有类型的错误信息，你可以查看这个响应体以了解到底发生了什么。

你可能首先要设计一个错误处理器，就像这样：  

```js
handleError(error) {
  if (error.error instanceof ErrorEvent) {
    // A client-side or network error occurred. Handle it accordingly.
    console.error('An error occurred:', error.error.message);
  } else {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
    console.error(
      `Backend returned code ${error.status}, ` +
      `body was: ${error.error}`);
  }
  // return an observable with a user-facing error message
  return throwError(
    'Something bad happened; please try again later.');
};
```

注意，该处理器返回一个带有用户友好的错误信息的 RxJS ErrorObservable 对象。 该服务的消费者期望服务的方法返回某种形式的 Observable，就算是“错误的”也可以。  

现在，你获取了由 Rjax 方法返回的 Observable，并把它们通过管道传给错误处理器。

```js
import { catchError } from 'rxjs/operators';

getConfig() {
  return this.rjax.get(this.configUrl)
    .pipe(
      catchError(this.handleError)
    );
}
```

### retry()

有时候，错误只是临时性的，只要重试就可能会自动消失。 比如，在移动端场景中可能会遇到网络中断的情况，只要重试一下就能拿到正确的结果。

RxJS 库提供了几个 retry 操作符，它们值得仔细看看。 其中最简单的是 retry()，它可以对失败的 Observable 自动重新订阅几次。对 HttpClient 方法调用的结果进行重新订阅会导致重新发起 HTTP 请求。

把它插入到 Rjax 方法结果的管道中，就放在错误处理器的紧前面。

```js
import { retry, catchError } from 'rxjs/operators';

getConfig() {
  return this.rjax.get(this.configUrl)
    .pipe(
      retry(3), // retry a failed request up to 3 times
      catchError(this.handleError) // then handle the error
    );
}
```

## 请求非 JSON 格式的数据

不是所有的 API 都会返回 JSON 数据。在下面这个例子中的方法会从服务器读取文本文件， 并把文件的内容记录下来，然后把这些内容使用 Observable 的形式返回给调用者。

```js
getTextFile(filename) {
  // The Observable returned by get() is of type Observable<string>
  // because a text response was specified.
  // There's no need to pass a <string> type parameter to get().
  return this.rjax.get(filename, {responseType: 'text'})
    .pipe(
      tap( // Log the result or error
        data => this.log(filename, data),
        error => this.logError(filename, error)
      )
    );
}
```

这里的 rjax.get() 返回字符串而不是默认的 JSON 对象，因为它的 responseType 选项是 'text'。

这里的 rjax.get() 返回字符串而不是默认的 JSON 对象，因为它的 responseType 选项是 'text'。

responseType的可选值有 "arraybuffer" | "blob" | "text" | "json"

## 读取完整的响应体
响应体可能并不包含你需要的全部信息。有时候服务器会返回一个特殊的响应头或状态码，以标记出特定的条件，因此读取它们可能是必要的。

要这样做，你就要通过 observe 选项来告诉 Rjax，你想要完整的响应信息，而不是只有响应体：

```js
getConfigResponse() {
  return this.rjax.get(
    this.configUrl, { observe: 'response' });
}
```

现在 rjax.get() 会返回一个 [HttpResponse](https://www.angular.cn/api/common/http/HttpResponse) 类型的 Observable，而不只是 JSON 数据。

## 监听进度事件
有时，应用会传输大量数据，并且这些传输可能会花费很长时间。 典型的例子是文件上传。 可以通过在传输过程中提供进度反馈，来提升用户体验。

要想开启进度事件的响应，你可以创建一个把 reportProgress 选项设置为 true 的 HttpRequest 实例，以开启进度跟踪事件。

```js
import { HttpRequest } from 'rjax';

const req = new HttpRequest('POST', '/upload/file', file, {
  reportProgress: true
});
```

::: warning
每个进度事件都会触发变更检测，所以，你应该只有当确实希望在 UI 中报告进度时才打开这个选项。
:::

接下来，把这个请求对象传给 rjax.request() 方法，它返回一个 HttpEvents 的 Observable，同样也可以在拦截器中处理这些事件。

```js
return this.rjax.request(req).pipe(
  map(event => this.getEventMessage(event, file)),
  tap(message => this.showProgress(message)),
  last(), // return last (completed) message to caller
  catchError(this.handleError(file))
);
```

getEventMessage 方法会解释事件流中的每一个 HttpEvent 类型。

```js
import { HttpEventType } from 'rjax';

/** Return distinct message for sent, upload progress, & response events */
private getEventMessage(event, file) {
  switch (event.type) {
    case HttpEventType.Sent:
      return `Uploading file "${file.name}" of size ${file.size}.`;

    case HttpEventType.UploadProgress:
      // Compute and show the % done:
      const percentDone = Math.round(100 * event.loaded / event.total);
      return `File "${file.name}" is ${percentDone}% uploaded.`;

    case HttpEventType.Response:
      return `File "${file.name}" was completely uploaded!`;

    default:
      return `File "${file.name}" surprising upload event: ${event.type}.`;
  }
}
```