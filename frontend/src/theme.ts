import { createMuiTheme } from "@material-ui/core";
import { blue, grey } from "@material-ui/core/colors";
let themeRaw = createMuiTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: blue[700]
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      main: grey[500]
      // dark: will be calculated from palette.secondary.main,
      // contrastText: "#ffcc00"
    },
    text: {
      primary: grey[900],
      secondary: grey[500]
    },
    action: {
      active: blue[700]
    },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 500
    },
    h2: {
      fontSize: 20,
      fontWeight: 400
    },
    h3: {
      fontSize: 18,
      fontWeight: 500
    },
    h4: {
      fontSize: 18,
      fontWeight: 400
    },
    h5: {
      fontSize: 15,
      fontWeight: 500
    },
    h6: {
      fontSize: 15,
      fontWeight: 400
    },
    body1: {
      fontSize: 13,
      fontWeight: 400
    },
    body2: {
      fontSize: 13,
      fontWeight: 500
    },
    button: {
      fontSize: 13,
      fontWeight: 500,
      textTransform: "capitalize"
    },
    caption: {
      fontSize: 12,
      fontWeight: 400
    }
  },
  overrides: {
    MuiButton: {
      contained: {
        boxShadow: "0 2px 3px 0px rgba(0,0,0, .25)"
      },
      containedPrimary: {
        boxShadow: "0 2px 3px 0px rgba(0,0,0, .25)"
      }
    }
  }
});

// export const theme = responsiveFontSizes(themeRaw);
export const theme = themeRaw;
