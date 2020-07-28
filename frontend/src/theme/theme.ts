import { createMuiTheme, PaletteType } from "@material-ui/core";
import { green, grey, indigo, red } from "@material-ui/core/colors";
import colors from "./colors";

export const primaryBackgroud = indigo[50];
export const primaryColor = indigo[700];

let themeRaw = createMuiTheme({
  props: {
    MuiTextField: {
      // variant: "outlined",
      size: "small",
    },
  },
  typography: {
    h1: {
      fontSize: 28,
    },
    h2: {
      fontSize: 22,
    },
    h3: {
      fontSize: 20,
    },
    h4: {
      fontSize: 20,
    },
    h5: {
      fontSize: 18,
    },
    h6: {
      fontSize: 18,
    },
    body1: {
      fontSize: 16,
    },
    body2: {
      fontSize: 16,
      color: "rgba(0, 0, 0, 0.6);",
    },
    button: {
      fontSize: 16,
      textTransform: "capitalize",
    },
    caption: {
      fontSize: 13,
    },
  },
  overrides: {
    MuiTableCell: { root: { width: "auto !important", fontWeight: "normal" } },
    MuiExpansionPanel: {
      root: {
        marginTop: 16,
        marginBottom: 16,
        borderRadius: 0,
        "&:first-child": {
          marginTop: 0,
        },
      },
    },
    MuiExpansionPanelSummary: {
      root: {
        "&$expanded": {
          minHeight: "auto",
          background: grey[100],
        },
      },
      content: {
        "&$expanded": {
          margin: "inherit",
        },
      },
    },
    MuiExpansionPanelDetails: {
      root: {
        padding: 16,
      },
    },
    MuiInputLabel: {
      root: {
        // fontWeight: 500,
        fontSize: 16,
        // color: "#000",
      },
    },
    MuiPaper: {
      root: {
        // backgroundColor: "#FAFAFA",
      },
    },
    MuiButton: {
      contained: {
        boxShadow: "0 1px 3px 0px rgba(0,0,0, .2)",
      },
      containedPrimary: {
        boxShadow: "0 1px 3px 0px rgba(0,0,0, .2)",
      },
      // textPrimary: {
      //   // backgroundColor: "rgba(25, 118, 210, 0.04)",
      //   "&:hover": {
      //     backgroundColor: "rgba(25, 118, 210, 0.1)"
      //   }
      // },
      textSizeLarge: {
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    MuiSvgIcon: {
      fontSizeSmall: {
        fontSize: "1.0rem",
      },
    },
    MuiToolbar: {
      regular: {
        height: 20,
        minHeight: 44,
        "@media (min-width: 600px)": {
          minHeight: 44,
        },
      },
    },
    MuiFormLabel: {
      root: {
        // color: "black"
      },
    },
    MuiFormControl: {
      marginNormal: {
        paddingBottom: 0,
      },
    },
  },
});

const lightTheme = createMuiTheme({
  palette: {
    primary: {
      main: indigo[500],
      light: indigo[50],
      dark: indigo[700],
      contrastText: colors.textWhiteHighEmphasis,
    },
    secondary: grey,
    success: {
      main: green[700],
    },
    error: {
      main: red[700],
    },
    text: {
      primary: grey[900],
      secondary: grey[500],
    },
    // action: {
    //   active: indigo[700]
    // },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
    type: "light",
  },
});

const darkTheme = createMuiTheme({
  palette: {
    primary: {
      main: indigo[500],
      light: indigo[50],
      dark: indigo[700],
      contrastText: colors.textWhiteHighEmphasis,
    },
    secondary: grey,
    success: {
      main: green[700],
    },
    error: {
      main: red[700],
    },
    text: {
      primary: grey[900],
      secondary: grey[500],
    },
    // action: {
    //   active: indigo[700]
    // },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
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
