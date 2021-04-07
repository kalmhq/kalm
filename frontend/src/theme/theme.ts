import { createMuiTheme, PaletteType } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";

const primaryBackgroud = blue[50];
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
        "&:first-child": {
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        },
        "&:last-child": {
          borderBottomLeftRadius: "10px",
          borderBottomRightRadius: "10px",
        },
      },
    },
    MuiButton: {
      root: {
        borderRadius: "10px",
        fontWeight: "bold",
      },
      containedPrimary: {
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
        },
      },
    },
    MuiTableCell: {
      root: {
        paddingTop: 8,
        paddingBottom: 8,
      },
      head: {
        color: "rgba(0, 0, 0, 0.5)",
        borderBottom: "dashed 1px lightgray",
      },
      body: {
        borderBottom: "dashed 1px lightgray",
      },
    },
    MuiTableRow: {
      root: {
        "&:last-child td": {
          borderBottom: "none",
        },
        "&:last-child th": {
          borderBottom: "none",
        },
      },
      head: {
        borderBottom: "dashed 1px lightgray",
      },
    },
  },
  palette: {
    primary: {
      main: "#36A7FC",
      light: "rgb(71, 145, 219)",
      dark: "rgb(17, 82, 147)",
      contrastText: "#fff",
    },
    secondary: {
      light: "#ffb74d",
      main: "#f9b934",
      dark: "#f57c00",
      contrastText: "rgba(0, 0, 0, 0.87)",
    },
    background: {
      paper: "#fff",
      default: "#e5e5e5",
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
        "&:first-child": {
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
        },
        "&:last-child": {
          borderBottomLeftRadius: "10px",
          borderBottomRightRadius: "10px",
        },
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
