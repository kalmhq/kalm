import { createMuiTheme, PaletteType } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";

export const primaryBackgroud = blue[50];
export const primaryColor = "#36A7FC";

let themeRaw = createMuiTheme({
  typography: {
    fontFamily: "Lato, Roboto, Helvetica, Arial, sans-serif",
  },
});

const lightTheme = createMuiTheme({
  overrides: {
    MuiPaper: {
      rounded: {
        borderRadius: "10px",
      },
    },
    MuiExpansionPanel: {
      rounded: {
        borderRadius: "10px",
      },
    },
    MuiButton: {
      root: {
        borderRadius: "10px",
      },
    },
    MuiTableCell: {
      head: {
        color: "rgba(0, 0, 0, 0.5)",
      },
      root: {
        paddingTop: 8,
        paddingBottom: 8,
      },
    },
  },
  palette: {
    primary: {
      main: primaryColor,
      contrastText: "#FFFFFF",
    },
    secondary: {
      light: blue[100],
      main: blue[200],
      dark: blue[300],
      contrastText: "#FFFFFF",
    },
    background: {
      paper: "#fff",
      default: "#F5F5F5",
    },
    type: "light",
  },
});

const darkTheme = createMuiTheme({
  overrides: {
    MuiPaper: {
      rounded: {
        borderRadius: "10px",
      },
    },
    MuiExpansionPanel: {
      rounded: {
        borderRadius: "10px",
      },
    },
    MuiButton: {
      root: {
        borderRadius: "10px",
      },
    },
    MuiPopover: {
      paper: {
        border: "1px solid rgba(255, 255, 255, 0.12)",
      },
    },
    MuiTableCell: {
      head: {
        color: "rgba(255, 255, 255, 0.5)",
      },
    },
  },
  palette: {
    primary: {
      light: blue[200],
      main: blue[300],
      dark: blue[400],
      contrastText: "#FFFFFF",
    },
    // secondary: amber,
    secondary: {
      light: blue[100],
      main: blue[200],
      dark: blue[300],
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
  themeRaw.overrides = themePalette.overrides;
  return {
    ...themeRaw,
    palette: {
      ...themePalette.palette,
    },
  };
};
