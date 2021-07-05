import isFunction from "./lib/isFunction";
import {
  ExportedNextConfig,
  NextConfigFunction,
  WebpackConfigFunction,
} from "./types/config";
import EsCheckWebpackPlugin from "./lib/EsCheckWebpackPlugin";
const withTM = require("next-transpile-modules");
const { withSentryConfig } = require("@sentry/nextjs");

export function withPreset(nextConfig: ExportedNextConfig): NextConfigFunction {
  return (phase, defaults) => {
    const { preset, webpack, headers, ...baseConfig } = isFunction(nextConfig)
      ? nextConfig(phase, defaults)
      : nextConfig;

    let config = baseConfig ?? {};

    // Set misc. defaults
    config.poweredByHeader = baseConfig.poweredByHeader ?? false;
    config.pageExtensions = baseConfig.pageExtensions ?? ["api.ts", "page.tsx"];

    // Set default headers
    config.headers = async () => {
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

    // Register custom webpack plugins
    const webpackConfig: WebpackConfigFunction = (config, options) => {
      const baseConfig = webpack ? webpack(config, options) : config;

      if (!options.dev) {
        // Next.js doesn't let you change this is dev even if you want to - see
        // https://github.com/vercel/next.js/blob/master/errors/improper-devtool.md
        baseConfig.devtool = "source-map";

        baseConfig.plugins?.push(new EsCheckWebpackPlugin());
      }

      return baseConfig;
    };

    config.webpack = webpackConfig;

    if (preset?.transpileModules) {
      config = withTM(preset.transpileModules)(baseConfig);
    }

    if (preset?.sentry?.enabled) {
      config = withSentryConfig(config, preset?.sentry?.webpackPluginOptions)(
        phase,
        defaults
      );
    }

    return config;
  };
}
