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
      vendors: {
        // 基本框架
        chunks: "all",
        test: /(react|react-dom|react-dom-router|@material|immutable|src)/,
        priority: 100,
        name: "vendors",
      },
      chartjsVendor: {
        // 异步加载echarts包
        test: /chart/,
        priority: 100, // 高于async-commons优先级
        name: "chartjsVendor",
        chunks: "async",
      },
      xtermVendor: {
        // 异步加载echarts包
        test: /xterm/,
        priority: 100, // 高于async-commons优先级
        name: "xtermVendor",
        chunks: "async",
      },
      asyncCommons: {
        // 其余异步加载包
        chunks: "async",
        minChunks: 2,
        name: "async-commons",
        priority: 90,
      },
      commons: {
        // 其余同步加载包
        chunks: "all",
        minChunks: 2,
        name: "commons",
        priority: 80,
      },
    },
  }),
  addWebpackPlugin(new BundleAnalyzerPlugin()),
  ...addBabelPlugins("date-fns"),
  useBabelRc(),
);
