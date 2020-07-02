import { addParameters } from "@storybook/react";
import { themes } from "@storybook/theming";
import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { DocsPage } from "storybook-addon-deps/blocks";
import { global } from "@storybook/design-system";
const { GlobalStyle } = global;

addParameters({
  options: {
    theme: themes.light,
    showRoots: true,
  },
  docs: { page: DocsPage },
  dependencies: {
    // display only dependencies/dependents that have a story in storybook
    // by default this is false
    // withStoriesOnly: false,
    // completely hide a dependency/dependents block if it has no elements
    // by default this is false
    // hideEmpty: false,
  },
  viewport: {
    viewports: INITIAL_VIEWPORTS, // newViewports would be an ViewportMap. (see below for examples)
    defaultViewport: "responsive",
  },
  backgrounds: [
    { name: "page", value: "#F4F5F7", default: true },
    { name: "table", value: "#FAFAFA" },
    { name: "white", value: "#FFFFFF" },
  ],
});

const withGlobalStyle = (storyFn) => (
  <>
    <GlobalStyle />
    {storyFn()}
  </>
);

export const decorators = [withGlobalStyle];

//   loadFontsForStorybook();
