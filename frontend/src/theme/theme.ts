import { createMuiTheme, PaletteType } from "@material-ui/core";
import { indigo, amber } from "@material-ui/core/colors";

export const primaryBackgroud = indigo[50];
export const primaryColor = indigo[700];

let themeRaw = createMuiTheme({});

const lightTheme = createMuiTheme({
  palette: {
    primary: indigo,
    secondary: {
      light: indigo[100],
      main: indigo[200],
      dark: indigo[300],
      contrastText: "#FFFFFF",
    },
    type: "light",
  },
});

const darkTheme = createMuiTheme({
  palette: {
    primary: {
      light: indigo[200],
      main: indigo[300],
      dark: indigo[400],
      contrastText: "#FFFFFF",
    },
    // secondary: amber,
    secondary: {
      light: indigo[100],
      main: indigo[200],
      dark: indigo[300],
      contrastText: "#FFFFFF",
    },
    background: {
      paper: "#212121",
      default: "#121212",
    },
    type: "dark",
  },
});

// export const theme = responsiveFontSizes(themeRaw);
export const theme = themeRaw;

export const getTheme = (themeColor: PaletteType) => {
  const themePalette = themeColor === "light" ? lightTheme : darkTheme;
  themeRaw.palette = themePalette.palette;
  return {
    ...themeRaw,
    palette: {
      ...themePalette.palette,
    },
  };
};
