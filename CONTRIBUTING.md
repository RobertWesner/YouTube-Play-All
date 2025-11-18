# YTPA Contributing

## script.user.js

Please prevent direct usage of `setTimeout()`, `setInterval()`, and `obj.addEventListener()`,
as errors within those calls cannot be properly assigned to the userscript without manually
calling `safeWrapCall()`.

Usage of `innerHTML`, `outerHTML`, `insertAdjacentHTML()`, etc. is not permitted as it opens
the script up to XSS attacks and requires bypassing the trusted types policy of YouTube.
Please use `$builder()` and `$populate` to dynamically create elements when necessary.

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

### $builder() and $populate()

More wordy, but also more secure.

```js
container.insertAdjacentHTML('beforeend', `
    <div class="foo bar">
        Some text: Test
        some value: ${value} <- this is bad
    </div>
`);
```

```js
container.insertAdjacentElement('beforeend', $populate(
    () => $builder('div')
        .className('foo bar')
        .build(),
    element => element.textContent = `
        Some text: Test
        some value: ${value} <- this is secure!
    `.trim(),
);
```
