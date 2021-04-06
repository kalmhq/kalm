import { CssBaseline, PaletteType, ThemeProvider } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { KalmRoutes } from "routes";
import { RootState } from "store";
import { getTheme } from "theme/theme";
import { HistoryUserConfirmation } from "widgets/History";
import { Snackbar } from "widgets/Notification";
import { ScrollToTop } from "widgets/ScrollToTop";

const mapStateToProps = (state: RootState) => {
  const usingTheme = state.settings.usingTheme;
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
      <BrowserRouter getUserConfirmation={HistoryUserConfirmation}>
        <div id="history-prompt-anchor" />

        <ScrollToTop>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Snackbar />
            {KalmRoutes}
          </ThemeProvider>
        </ScrollToTop>
      </BrowserRouter>
    );
  }
}

export const App = connect(mapStateToProps)(AppRaw);
