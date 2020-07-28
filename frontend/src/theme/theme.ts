import { createMuiTheme, PaletteType } from "@material-ui/core";
import { indigo } from "@material-ui/core/colors";

export const primaryBackgroud = indigo[50];
export const primaryColor = indigo[700];

let themeRaw = createMuiTheme({});

const lightTheme = createMuiTheme({
  palette: {
    type: "light",
  },
});

const darkTheme = createMuiTheme({
  palette: {
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
