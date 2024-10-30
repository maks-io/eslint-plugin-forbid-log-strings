# eslint-plugin-forbid-log-strings 🖥️

[![Version](https://img.shields.io/npm/v/eslint-plugin-forbid-log-strings)](https://www.npmjs.com/package/eslint-plugin-forbid-log-strings)

Forbid certain strings in logger statements.

Can be used with the built-in `console` - or with any custom logger.

## Examples

### Example #1 - simple case

You might configure the plugin to show an error if a `console` statement includes a hardcoded `'debug'` string:

Plugin Configuration:

```javascript
// .eslintrc.js

module.exports = {
  // ...
  plugins: [
    "forbid-log-strings",
    // ... maybe other plugins here ...
  ],
  rules: {
    "forbid-log-strings/check": [
      "error",
      [
        {
          forbiddenPatterns: ["/debug/i"], // <--- can be a string or a RegExp, both have to be defined as strings though (with quotes)
        },
      ],
    ],
    // ... maybe other rules here ...
  },
};
```

→ Result:

```typescript
// some javascript or typescript file

console.log("some text..."); // <--- ✅ ok
console.log("debug", "some text..."); // <--- ❌ throws error
console.log("DEBUG", "some text..."); // <--- ❌ throws error
console.log("debug some text..."); // <--- ❌ throws error
console.log("DEBUG some text..."); // <--- ❌ throws error
```

### Example #2 - use a custom logger + exclude log level 'error'

The following example uses [cheese-log](https://www.npmjs.com/package/cheese-log) as a custom logger.

Plugin Configuration:

```javascript
// .eslintrc.js

module.exports = {
  // ...
  plugins: [
    "forbid-log-strings",
    // ... maybe other plugins here ...
  ],
  rules: {
    "forbid-log-strings/check": [
      "error",
      [
        {
          forbiddenPatterns: ["/debug/i"],
          customLoggers: ["cheese"], // <--- a cheese-log method call would look like cheese.log("hello world!"), therefore we set "cheese" as the object name
          excludeLevels: ["error"],
        },
      ],
    ],
    // ... maybe other rules here ...
  },
};
```

→ Result:

```typescript
// some javascript or typescript file

cheese.log("some text..."); // <--- ✅ ok
cheese.error("debug", "some text..."); // <--- ✅ also ok, because we exluded level 'error'
cheese.log("debug", "some text..."); // <--- ❌ throws error
console.log("debug", "some text..."); // <--- ✅ throws no error, since we are looking at the cheese-log logger, not console!
```

## Installation

Via npm:

```bash
npm i eslint-plugin-forbid-log-strings --save-dev
```

Via yarn:

```bash
yarn add -D eslint-plugin-forbid-log-strings
```

## Configuration Details

The plugin can be configured with 1 or more configurations.

Every configuration knows the following properties:

| property name     | required                                                                                                                                                       | allowed values                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| forbiddenPatterns | yes                                                                                                                                                            | Array consisting of patterns in the shape of strings and/or Regular Expressions. If you want to provide a RegExp also provide it as a string (see examples above) - the plugin will automatically detect whether it is a RegExp or a plain string value.                                                                                                                                |
| logic             | Yes, if the length of forbiddenPatterns is >= 2. (Make sure to not provide this property if the length === 1, otherwise the plugin will throw a general error) | Must be one of `"AND"`, `"OR"` and `"XOR"`. It defines which logic is being used when multiple `forbiddenPatterns` are provided.                                                                                                                                                                                                                                                        |
| customLoggers     | no                                                                                                                                                             | Array of custom loggers. Make sure to provide the object name on which the logger methods are called. For example, for the [cheese-log](https://www.npmjs.com/package/cheese-log) logger the statements would look like `cheese.debug("hello world!")`, etc. - therefore the provided value in the plugin configuration must be `["cheese"]`. You can provide 1 or more custom loggers. |
| excludedLevels    | no                                                                                                                                                             | Array of log levels that should be ignored. For instance `["info", "warn", "debug"]`.                                                                                                                                                                                                                                                                                                   |

## If you enjoy using this...

<a href="https://www.buymeacoffee.com/maks_io" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 48px !important;" ></a>
