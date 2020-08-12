const path = require("path");
const resolve = (dir) => path.resolve(__dirname, dir);

module.exports = async ({ config }) => {
  config.resolve = Object.assign(config.resolve, {
    alias: {
      "@apiType": resolve(
        `../src/api/${
          process.env.REACT_APP_USE_MOCK_API === "true" || process.env.NODE_ENV === "test" ? "mockApi" : "realApi"
        }`,
      ),
    },
  });

  return config;
};
