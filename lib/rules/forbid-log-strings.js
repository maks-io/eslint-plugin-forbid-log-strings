module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow specific console strings",
      category: "Best Practices",
      recommended: false,
    },
    schema: [
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            forbiddenPatterns: {
              type: "array",
              items: {
                anyOf: [
                  { type: "string" },
                  { type: "object", instanceOf: "RegExp" },
                ],
              },
              uniqueItems: true,
            },
            logic: {
              type: "string",
              enum: ["OR", "AND", "XOR"],
            },
            excludeLevels: {
              type: "array",
              items: {
                type: "string",
                enum: ["log", "warn", "error", "info", "debug", "trace"],
              },
              uniqueItems: true,
            },
            customLoggers: {
              type: "array",
              items: { type: "string" },
              uniqueItems: true,
            },
          },
          additionalProperties: false,
          required: ["forbiddenPatterns"],
        },
      },
    ],
    messages: {
      forbiddenConsole:
        "Forbidden {{loggerName}}.{{logMethod}} statement, because it includes {{explanation}} (plugin configuration #{{configurationIndex}}).",
      missingLogic:
        "[plugin configuration error] The 'logic' property must be defined if forbiddenPatterns length > 1.",
      unnecessaryLogic:
        "[plugin configuration error] The 'logic' property must not be defined if forbiddenPatterns length is 1.",
    },
  },
  create(context) {
    const configurations = context.options[0] || [];

    function getMatch(pattern) {
      const regexPattern = /^\/(.*)\/([gimuydsv]*)$/;
      return pattern.match(regexPattern);
    }

    function isRegex(pattern) {
      return Boolean(getMatch(pattern));
    }

    function parsePattern(pattern) {
      const match = getMatch(pattern);

      if (match) {
        // It's a regex with optional flags
        return new RegExp(match[1], match[2]);
      }
      // Otherwise, treat it as a plain word with word boundary match
      return new RegExp(`\\b${pattern}\\b`, "i");
    }

    function validateConfig(config, index) {
      const { forbiddenPatterns, logic } = config;
      if (forbiddenPatterns.length > 1 && !logic) {
        context.report({
          messageId: "missingLogic",
          loc: { line: 1, column: index + 1 },
        });
      } else if (forbiddenPatterns.length === 1 && logic) {
        context.report({
          messageId: "unnecessaryLogic",
          loc: { line: 1, column: index + 1 },
        });
      }
    }

    function matchesPattern(string, { forbiddenPatterns, logic }) {
      const regexPatterns = forbiddenPatterns.map(parsePattern);
      const matches = regexPatterns.map((regex) => regex.test(string));

      if (logic === "OR") return matches.some(Boolean);
      if (logic === "AND") return matches.every(Boolean);
      if (logic === "XOR") return matches.filter(Boolean).length === 1;
      return false;
    }

    return {
      Program() {
        configurations.forEach((config, index) => {
          validateConfig(config, index);
        });
      },
      CallExpression(node) {
        const { callee } = node;

        // Determine if this is a console or custom logger statement
        const isConsoleStatement =
          callee.type === "MemberExpression" &&
          callee.object.name === "console";
        const customLoggerNames = configurations.flatMap(
          (config) => config.customLoggers || [],
        );
        const isCustomLoggerStatement =
          callee.type === "MemberExpression" &&
          customLoggerNames.includes(callee.object.name);

        if (!isConsoleStatement && !isCustomLoggerStatement) {
          return; // Exit if it's neither console nor a custom logger statement
        }

        const logMethod = callee.property.name;
        const messageArgsMap = node.arguments
          .filter(
            (arg) => arg.type === "Literal" && typeof arg.value === "string",
          )
          .map((arg) => arg.value);
        const messageArguments = messageArgsMap.join(" "); // Combine all string arguments into a single string

        for (const index in configurations) {
          const config = configurations[index];
          // Skip this configuration if the level is excluded
          if (
            config.excludeLevels &&
            config.excludeLevels.includes(logMethod)
          ) {
            continue;
          }

          // Check if it's console and configuration applies to console
          const appliesToConsole = isConsoleStatement && !config.customLoggers;
          // Check if it's a custom logger and configuration applies to the logger
          const appliesToCustomLogger =
            isCustomLoggerStatement &&
            config.customLoggers &&
            customLoggerNames.includes(callee.object.name);

          if (
            (appliesToConsole || appliesToCustomLogger) &&
            matchesPattern(messageArguments, config)
          ) {
            context.report({
              node,
              messageId: "forbiddenConsole",
              data: {
                loggerName: appliesToConsole
                  ? "console"
                  : `${config.customLoggers.length > 1 ? "(" : ""}${config.customLoggers.join("|")}${config.customLoggers.length > 1 ? ")" : ""}`,
                logMethod,
                configurationIndex: index,
                explanation: config.forbiddenPatterns
                  .map((p) => (!isRegex(p) ? `'${p}'` : p))
                  .join(` ${config.logic} `),
              },
            });
            return;
          }
        }
      },
    };
  },
};
