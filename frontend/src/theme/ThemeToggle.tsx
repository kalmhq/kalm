import React from "react";
import { IconButton } from "@material-ui/core";
import { BrightnessLightIcon, BrightnessDarkIcon } from "widgets/Icon";
import { RootState } from "reducers";
import { connect } from "react-redux";
import { setSettingsAction } from "actions/settings";
import { TDispatchProp } from "types";

const mapStateToProps = (state: RootState) => {
  const usingTheme = state.get("settings").get("usingTheme");
  return { usingTheme };
};
interface Props extends TDispatchProp, ReturnType<typeof mapStateToProps> {}

interface State {}

class ThemeToggleRaw extends React.PureComponent<Props, State> {
  public render() {
    const { usingTheme, dispatch } = this.props;
    return (
      <IconButton
        aria-label="Switch Tutorial"
        aria-haspopup="true"
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          dispatch(
            setSettingsAction({
              usingTheme: usingTheme === "light" ? "dark" : "light",
            }),
          );
        }}
        color="inherit"
      >
        {usingTheme === "dark" ? <BrightnessDarkIcon /> : <BrightnessLightIcon />}
      </IconButton>
    );
  }
}

export const ThemeToggle = connect(mapStateToProps)(ThemeToggleRaw);
