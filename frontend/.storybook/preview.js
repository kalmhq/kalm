import React from "react";
import { addParameters, addDecorator } from "@storybook/react";
import { themes } from "@storybook/theming";
import { INITIAL_VIEWPORTS, DEFAULT_VIEWPORT } from "@storybook/addon-viewport";
import { DocsPage } from "storybook-addon-deps/blocks";
import { global } from "@storybook/design-system";
import { StylesProvider } from "@material-ui/styles";
import { ThemeProvider } from "@material-ui/core/styles";
import { theme } from "theme/theme";
import { select, withKnobs } from "@storybook/addon-knobs";

const { GlobalStyle } = global;
const muiThemes = { KALMTheme1: theme, KALMTheme2: theme };
const muiThemeNames = Object.keys(muiThemes);

const newViewports = {
  macbookpro: {
    name: "Macbook Pro",
    styles: {
      width: "1440px",
      height: "900px",
    },
    type: "desktop",
  },
  response: {
    id: "reset",
    title: "Reset viewport",
    styles: null,
    type: "other",
  },
};

const withGlobalStyle = (storyFn) => {
  const theme = select("Theme", muiThemeNames, muiThemeNames[0], "Themes");
  return (
    <StylesProvider injectFirst>
      <GlobalStyle />
      <ThemeProvider theme={muiThemes[theme]}>{storyFn()}</ThemeProvider>
    </StylesProvider>
  );
};

addDecorator(withGlobalStyle);
// addDecorator(withKnobs);
//   loadFontsForStorybook();

addParameters({
  options: {
    theme: themes.light,
    showRoots: false,
  },
  docs: {
    page: DocsPage,
  },
  dependencies: {
    withStoriesOnly: false,
    hideEmpty: true,
  },
  viewport: {
    viewports: { ...INITIAL_VIEWPORTS, ...newViewports }, // newViewports would be an ViewportMap. (see below for examples)
    defaultViewport: "macbookpro",
  },
});

// export const decorators = [withGlobalStyle];
