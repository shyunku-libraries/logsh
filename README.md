# Logsh: JS/TS console functions overrider

You can view logs from default javascript/typescript console functions in your terminal.\
This module supports only nodejs.

## Installation

```bash
npm i logsh
```

## Features

- [x] supports file stack frame
- [ ] supports custom color of console functions output
- [ ] supports custom format of date time
- [ ] supports custom format of output

## Usage

```js
const logsh = require("logsh");
logsh.init();
```

or

```js
import logsh from "logsh";
logsh.init();
```

then you can use console functions like this:

```js
console.log("Hello world!"); // general console.log function (not overrided)
console.debug("Hello world!");
console.info("Hello world!");
console.warn("Hello world!");
console.error("Hello world!");
```
