import { WebpackConfigFunction } from "./../types/config";

export default function extendWebpackConfig(
  webpackConfig: WebpackConfigFunction,
  currentWebpackConfig?: WebpackConfigFunction
): WebpackConfigFunction {
  return (config, options) => {
    const currentConfig = currentWebpackConfig
      ? currentWebpackConfig(config, options)
      : config;

    return webpackConfig(currentConfig, options);
  };
}
