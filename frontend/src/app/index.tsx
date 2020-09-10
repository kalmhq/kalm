import React from "react";
import { CssBaseline, ThemeProvider, PaletteType } from "@material-ui/core";
import { ScrollToTop } from "widgets/ScrollToTop";
import { KalmRoutes } from "routes";
import { Snackbar } from "widgets/Notification";
import { RootState } from "reducers";
import { getTheme } from "theme/theme";
import { connect } from "react-redux";

const mapStateToProps = (state: RootState) => {
  const usingTheme = state.get("settings").usingTheme;
  return {
    usingTheme,
  };
};
interface Props extends ReturnType<typeof mapStateToProps> {}

interface State {}

class AppRaw extends React.PureComponent<Props, State> {
  public render() {
    const { usingTheme } = this.props;
    const theme = getTheme(usingTheme as PaletteType);
    return (
      <>
        <div id="history-prompt-anchor" />

        <ScrollToTop>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Snackbar />
            {KalmRoutes}
          </ThemeProvider>
        </ScrollToTop>
      </>
    );
  }
}

export const App = connect(mapStateToProps)(AppRaw);
