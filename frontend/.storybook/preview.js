import React from "react";
import { addParameters, addDecorator } from "@storybook/react";
import { themes } from "@storybook/theming";
import { INITIAL_VIEWPORTS } from "@storybook/addon-viewport";
import { DocsPage } from "storybook-addon-deps/blocks";
import { global } from "@storybook/design-system";
import { StylesProvider } from "@material-ui/styles";
import { ThemeProvider } from "@material-ui/core/styles";
import { theme } from "theme/theme";
import { select, withKnobs } from "@storybook/addon-knobs";

const { GlobalStyle } = global;
const muiThemes = { KALMTheme1: theme, KALMTheme2: theme };
const muiThemeNames = Object.keys(muiThemes);

const withGlobalStyle = (storyFn) => {
  const theme = select("Theme", muiThemeNames, muiThemeNames[0], "Themes");
  console.log("withGlobalStyle");
  return (
    <StylesProvider injectFirst>
      <GlobalStyle />
      <ThemeProvider theme={muiThemes[theme]}>{storyFn()}</ThemeProvider>
    </StylesProvider>
  );
};

addDecorator(withGlobalStyle);
addDecorator(withKnobs);
//   loadFontsForStorybook();

addParameters({
  options: {
    theme: themes.light,
    showRoots: true,
  },
  // docs: {
  //   // page: DocsPage,

  // },
  docs: {
    page: DocsPage,
    // ({ children, context }) => (
    //   // const theme = select("Theme", muiThemeNames, muiThemeNames[0], "Themes");
    //   // return (
    //   <DocsContainer context={context}>
    //     {/* <ThemeProvider theme={muiThemes[theme]}> */}
    //     <div style={{ border: "5px solid red" }}>{children}</div>
    //     {/* </ThemeProvider> */}
    //   </DocsContainer>
    //   // );
    // ),
  },
  dependencies: {
    // display only dependencies/dependents that have a story in storybook
    // by default this is false
    withStoriesOnly: false,
    // completely hide a dependency/dependents block if it has no elements
    // by default this is false
    hideEmpty: false,
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

// export const decorators = [withGlobalStyle];
