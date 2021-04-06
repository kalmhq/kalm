import { FormControlLabel, Switch } from "@material-ui/core";
import { setSettingsAction } from "actions/settings";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "store";

const mapStateToProps = (state: RootState) => {
  return {
    open: state.settings.isDisplayingHelpers,
  };
};

class HelperSwitchRaw extends React.PureComponent<ReturnType<typeof mapStateToProps> & DispatchProp> {
  private handleChange = () => {
    const { open } = this.props;

    this.props.dispatch(
      setSettingsAction({
        isDisplayingHelpers: !open,
      }),
    );
  };

  public render() {
    const { open } = this.props;
    return (
      <FormControlLabel
        label={open ? "Detail Mode" : "Concise Mode"}
        labelPlacement="start"
        control={<Switch checked={open} onChange={this.handleChange} color="primary" />}
      />
    );
  }
}

export const HelperSwitch = connect(mapStateToProps)(HelperSwitchRaw);
