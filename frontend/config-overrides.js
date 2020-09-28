const SentryWebpackPlugin = require("@sentry/webpack-plugin");
// confit-override.js
// 按需加载组件代码和样式
// addLessLoader 来帮助加载 less 样式，帮助自定义主题
// 使用插件让 Day.js 替换 momentjs 减小打包大小,
const { override, addWebpackPlugin, addWebpackAlias } = require("customize-cra");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const path = require("path");
const resolve = (dir) => path.join(__dirname, ".", dir);

module.exports = override(
  process.env.UPLOAD_SOURCE_MAP === "true"
    ? addWebpackPlugin(
        // https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/
        new SentryWebpackPlugin({
          // sentry-cli configuration
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          release: process.env.REACT_APP_NAME + "@" + process.env.REACT_APP_VERSION,

          // webpack specific configuration
          include: ".",
          ignore: ["node_modules", "webpack.config.js"],
        }),
      )
    : undefined,
  addWebpackAlias({
    "@apiType": resolve(
      `src/api/${
        process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test" ? "mockApi" : "realApi"
      }`,
    ),
  }),
  // addWebpackPlugin(new BundleAnalyzerPlugin()),
);
