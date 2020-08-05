import React from "react";
import { Switch, createStyles, withStyles, WithStyles, Theme, Tooltip } from "@material-ui/core";
import { BrightnessLightIcon, BrightnessDarkIcon } from "widgets/Icon";
import { RootState } from "reducers";
import { connect } from "react-redux";
import { setSettingsAction } from "actions/settings";
import { TDispatchProp } from "types";
import stringConstants from "utils/stringConstants";

const Styles = (theme: Theme) =>
  createStyles({
    root: {},
    switchBase: {
      padding: 8,
      color: theme.palette.primary.light,
    },
    error: {
      color: theme.palette.error.main,
      border: "1px solid " + theme.palette.error.main,
    },
  });

const mapStateToProps = (state: RootState) => {
  const usingTheme = state.get("settings").get("usingTheme");
  return { usingTheme };
};
interface Props extends TDispatchProp, ReturnType<typeof mapStateToProps>, WithStyles<typeof Styles> {}

interface State {}

class ThemeToggleRaw extends React.PureComponent<Props, State> {
  public render() {
    const { usingTheme, dispatch, classes } = this.props;
    return (
      <Tooltip title={stringConstants.APP_THEME_TOOLTIPS}>
        <Switch
          classes={{
            root: classes.root,
            switchBase: classes.switchBase,
          }}
          icon={<BrightnessDarkIcon />}
          checkedIcon={<BrightnessLightIcon />}
          checked={usingTheme === "light"}
          onChange={(event: React.ChangeEvent<HTMLElement>) => {
            dispatch(
              setSettingsAction({
                usingTheme: usingTheme === "light" ? "dark" : "light",
              }),
            );
          }}
        />
      </Tooltip>
    );
  }
}

export const ThemeToggle = connect(mapStateToProps)(withStyles(Styles)(ThemeToggleRaw));
