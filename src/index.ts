import isFunction from "./lib/isFunction";
import {
  ExportedNextConfig,
  NextConfigFunction,
  NextConfigObject,
} from "./types/config";
import BrowserCompatibilityWebpackPlugin from "./lib/plugins/BrowserCompatibilityWebpackPlugin";
import extendWebpackConfig from "./lib/extendWebpackConfig";
import withTM from "next-transpile-modules";
const { withSentryConfig } = require("@sentry/nextjs");

export function withPreset(nextConfig: ExportedNextConfig): NextConfigFunction {
  return (phase, defaults) => {
    const { preset, headers, ...baseConfig } = isFunction(nextConfig)
      ? nextConfig(phase, defaults)
      : nextConfig;

    let newConfig: NextConfigObject = baseConfig ?? {};

    // Set misc. defaults
    newConfig.poweredByHeader = newConfig.poweredByHeader ?? false;
    newConfig.pageExtensions = newConfig.pageExtensions ?? [
      "api.ts",
      "page.tsx",
    ];

    // Set default headers
    newConfig.headers = async () => {
      return [
        {
          source: "/:path*{/}?",
          headers: [
            {
              key: "x-frame-options",
              value: "deny",
            },
            {
              key: "content-security-policy",
              value: "frame-ancestors 'none'",
            },
            {
              key: "x-content-type-options",
              value: "nosniff",
            },
            {
              key: "Referrer-Policy",
              value: "same-origin",
            },
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000",
            },
            {
              key: "Permissions-Policy",
              value: "interest-cohort=()",
            },
          ],
        },
        ...(headers ? await headers() : []),
      ];
    };

    if (preset?.transpileModules) {
      newConfig = withTM(preset.transpileModules)(newConfig);
    }

    newConfig.webpack = extendWebpackConfig((config, options) => {
      if (!options.dev) {
        // Next.js doesn't let you change this is dev even if you want to - see
        // https://github.com/vercel/next.js/blob/master/errors/improper-devtool.md
        config.devtool = "source-map";

        config.plugins?.push(
          new BrowserCompatibilityWebpackPlugin(preset?.ignoreModules)
        );
      }

      return config;
    }, newConfig.webpack);

    if (preset?.sentry?.enabled) {
      const sentryConfig = withSentryConfig(
        newConfig,
        preset?.sentry?.webpackPluginOptions
      );

      newConfig = (
        isFunction(sentryConfig) ? sentryConfig(phase, defaults) : sentryConfig
      ) as NextConfigObject;
    }

    return newConfig;
  };
}
