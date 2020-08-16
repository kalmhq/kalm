const {
  override,
  addWebpackPlugin,
  addWebpackAlias,
  addBabelPlugins,
  useBabelRc,
  setWebpackOptimizationSplitChunks,
} = require("customize-cra");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const path = require("path");
const resolve = (dir) => path.join(__dirname, ".", dir);
module.exports = override(
  addWebpackAlias(
    {
      "@apiType": resolve(
        `src/api/${
          process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test" ? "mockApi" : "realApi"
        }`,
      ),
    },
    {
      "lodash-es": resolve("lodash"),
    },
  ),
  setWebpackOptimizationSplitChunks({
    cacheGroups: {
      xtermVendor: {
        chunks: "all",
        test: /xterm/,
        priority: 1000,
        name: "xtermVendor",
      },
      chartjsVendor: {
        chunks: "all",
        test: /chart/,
        priority: 900,
        name: "chartjsVendor",
      },
      chartjsVendor: {
        chunks: "all",
        test: /(ace-builds|react-ace)/,
        priority: 800,
        name: "aceBuildsVendor",
      },
      vendors: {
        chunks: "all",
        test: /(react|react-dom|react-dom-router|@material|immutable|src)/,
        priority: 100,
        name: "vendors",
      },
      asyncCommons: {
        chunks: "async",
        minChunks: 2,
        name: "async-commons",
        priority: 90,
      },
      commons: {
        chunks: "all",
        minChunks: 2,
        name: "commons",
        priority: 80,
      },
    },
  }),
  // addWebpackPlugin(new BundleAnalyzerPlugin()),
  ...addBabelPlugins("date-fns"),
  useBabelRc(),
);
