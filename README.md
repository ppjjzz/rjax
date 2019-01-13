# rjax

[![License](https://img.shields.io/badge/license-MIT-green.svg)](/LICENSE)

English | [简体中文](./README-zh_CN.md)

## ✨ Features

- Porting the excellent @angular/common/http module.
- Responsive ajax library based on rxjs.
- Written in TypeScript with predictable static types.
- Powerful and easy to use.

## 📦 Install

```bash
yarn add rjax # or: npm install rjax --save
```

## 🔨 Usage

```js
import { Rjax } from 'rjax';
const rjax = new Rjax();
rjax.get(`/user/12345`).subscribe(response => {
    // Succeed Callback
    console.log(response);
}, error => {
    // Error Callback
    console.log(error);
});
```

## Docs
API document and example [link]()

## Author

**rjax** © [ppjjzz](https://github.com/ppjjzz), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by ppjjzz.