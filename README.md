# next-preset
An easy to use preset for Next.js projects at Lightbase

### Page extensions

The following page extensions are configured by next-preset:
`api.ts`, `page.tsx`

This means that `_app.tsx` becomes `_app.page.tsx`, `_document.tsx` becomes `_document.page.tsx`, etc.

This configuration allows the placement of component files in the `/pages` directory, for storing local components with the page they're used on, without them becoming available as a route.

```
...
├── ...
├── src
│   ├── pages
│   │   ├── about-us
│   │   │   ├── components
│   │   │   │   └── Employee.tsx  👈 The component
│   │   │   └── index.page.tsx  👈 The page
├── ...
```

### Default headers

These headers are configured by default, because they're considered good security practice.
You can overwrite these headers by [setting the header yourself in `next.config.js`](https://nextjs.org/docs/api-reference/next.config.js/headers).

| Header                    | Value                  |
|---------------------------|------------------------|
| x-frame-options           | deny                   |
| content-security-policy.  | frame-ancestors 'none' |
| x-content-type-options    | nosniff                |
| Referrer-Policy           | same-origin            |
| Strict-Transport-Security | max-age=31536000       |
| Permissions-Policy        | interest-cohort=()     |

### Browser compatibility

When next-preset is used, a check is run on `next build` to make sure that the output does not contain any non-ES5 JavaScript code. This is done so your app does not unexpectedly break in certain browsers.

When offending output is found, the build fails and you're notified.
```
[PRESET] Checking browser compatibility...
[PRESET]
You might want to add the following entries to `preset.transpileModules` in `next.config.js`:

- yup

For more information, see: https://github.com/martpie/next-transpile-modules
```

Most modules can be transpiled. Modules that can't be transpiled can be ignored. Be sure to check if the module can be safely ignored or if you need to take additional steps per the modules' instructions.

#### Transpile modules

[next-transpile-modules](https://github.com/martpie/next-transpile-modules#readme) is included and configured by next-preset.

Modules to be transpiled can be added by setting the `preset.transpileModules` option in `next.config.js`.

```js
const { withPreset } = require("@lightbase/next-preset");

module.exports = withPreset({
  ...
  preset: {
    transpileModules: [
      "yup",
      "dequal",
    ],
    ...
  },
  ...
});

```

#### Ignore modules

Some modules produce non-ES5 code and cannot be transpiled, e.g. Mapbox-GL. Usually the module does not support older browsers, so it does not make sense for them to transpile to ES5 or support it.

Modules to be ignored can be added by setting the `preset.ignoreModules` option in `next.config.js`.

```js
const { withPreset } = require("@lightbase/next-preset");

module.exports = withPreset({
  ...
  preset: {
    ignoreModules: ["mapbox-gl"],
    ...
  },
  ...
});

```

#### Source maps

In order for the browser compatibility check to function, source maps are enabled and will be available alongside your app.

If you're using [@sentry/nextjs](https://github.com/getsentry/sentry-javascript/tree/master/packages/nextjs), source maps are already enabled.

