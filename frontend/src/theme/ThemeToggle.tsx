import { createStyles, Switch, Theme, Tooltip, withStyles, WithStyles } from "@material-ui/core";
import { setSettingsAction } from "actions/settings";
import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import StringConstants from "utils/stringConstants";
import { BrightnessDarkIcon, BrightnessLightIcon } from "widgets/Icon";

const Styles = (theme: Theme) =>
  createStyles({
    root: {},
    switchBase: {
      padding: 8,
      color: theme.palette.text.primary,
    },
    colorSecondary: {
      color: theme.palette.text.primary,
    },
    checked: {
      color: theme.palette.text.primary,
    },
    track: {
      color: theme.palette.text.primary,
    },
    error: {
      color: theme.palette.error.main,
      border: "1px solid " + theme.palette.error.main,
    },
  });

const mapStateToProps = (state: RootState) => {
  const usingTheme = state.settings.usingTheme;
  return { usingTheme };
};

interface Props extends TDispatchProp, ReturnType<typeof mapStateToProps>, WithStyles<typeof Styles> {}

interface State {}

class ThemeToggleRaw extends React.PureComponent<Props, State> {
  public render() {
    const { usingTheme, dispatch, classes } = this.props;
    return (
      <Tooltip title={StringConstants.APP_THEME_TOOLTIPS}>
        <Switch
          classes={{
            root: classes.root,
            switchBase: classes.switchBase,
            colorSecondary: classes.colorSecondary,
            checked: classes.checked,
            track: classes.track,
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
