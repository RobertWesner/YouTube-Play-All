# YTPA Contributing

## script.user.js

Please prevent direct usage of `setTimeout()`, `setInterval()`, and `obj.addEventListener()`,
as errors within those calls cannot be properly assigned to the userscript without manually
calling `safeWrapCall()`.

Below is a quick cheat sheet for how to use the _safe_ functions:

### setTimeout()

Drop-in replacement.

```js
setTimeout(() => {
    // ...
}, 1000);
```

```js
safeTimeout(() => {
    // ...
}, 1000);
```


### setInterval()

Drop-in replacement.

```js
setInterval(() => {
    // ...
}, 1000);
```

```js
safeInterval(() => {
    // ...
}, 1000);
```


### element.addEventListener()

Slightly different usage.

```js
element.addEventListener('click', () => {
    // ...
});
```

```js
safeEventListener(element, 'click', () => {
    // ...
});
```
