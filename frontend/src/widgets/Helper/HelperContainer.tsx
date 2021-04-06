import { Collapse } from "@material-ui/core";
import { RootState } from "configureStore";
import React from "react";
import { connect, DispatchProp } from "react-redux";

const mapStateToProps = (state: RootState) => {
  return {
    open: state.settings.isDisplayingHelpers,
  };
};

class HelperContainerRaw extends React.PureComponent<ReturnType<typeof mapStateToProps> & DispatchProp> {
  public render() {
    const { open } = this.props;
    return (
      <Collapse in={open} style={{ paddingTop: 8 }}>
        {this.props.children}
      </Collapse>
    );
  }
}

export const HelperContainer = connect(mapStateToProps)(HelperContainerRaw);
