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
            );
    }
}
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