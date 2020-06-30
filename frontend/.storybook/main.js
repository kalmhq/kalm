module.exports = {
  stories: ['../src/**/*.stories.(ts|tsx|js|jsx|mdx)'],
  addons: [
    '@storybook/preset-create-react-app',
    '@storybook/addon-actions',
    '@storybook/addon-links',
    '@storybook/addon-knobs/register',
    '@storybook/addon-viewport/register',
    '@storybook/addon-backgrounds/register',
    '@storybook/addon-essentials',
    '@storybook/addon-storysource',
    '@storybook/addon-a11y',
    {
      name: "@storybook/addon-docs",
      options: {
        configureJSX: true,
      },
    },
  ],
};
