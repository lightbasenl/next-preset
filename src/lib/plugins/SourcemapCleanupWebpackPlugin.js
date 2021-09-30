import removeSourceMaps from "../removeSourceMaps";

class SourcemapCleanupWebpackPlugin {
  apply(compiler) {
    /**
     * Determines whether plugin should be applied not more than once during whole webpack run.
     * Useful when the process is performing multiple builds using the same config.
     * It cannot be stored on the instance, as every run is creating a new one.
     */
    if (module.alreadyRun) {
      return;
    }

    module.alreadyRun = true;

    // Specify the event hook to attach to
    compiler.hooks.afterEmit.tapAsync("next-preset", async (compilation, callback) => {
      await removeSourceMaps();

      callback();
    });
  }
}

export default SourcemapCleanupWebpackPlugin;
