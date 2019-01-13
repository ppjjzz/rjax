# rjax

[![License](https://img.shields.io/badge/license-MIT-green.svg)](/LICENSE)

[English](./README.md) | 简体中文

## ✨ 特性

- 移植优秀的@angular/common/http模块。
- 基于rxjs的响应式请求库。
- 使用 TypeScript 构建，提供完整的类型定义文件。
- 功能强大又简单易用。

## 📦 安装

```bash
yarn add rjax # 或者：npm install rjax --save
```

## 🔨 示例

```js
import { Rjax } from 'rjax';
const rjax = new Rjax();
rjax.get(`/user/12345`).subscribe(response => {
    // 请求成功回调
    console.log(response);
}, error => {
    // 请求失败回调
    console.log(error);
});
```

## 文档
API 文档及示例 [链接]()

## 作者

**rjax** © [ppjjzz](https://github.com/ppjjzz), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by ppjjzz.