import { Collapse } from "@material-ui/core";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "../../reducers";

const mapStateToProps = (state: RootState) => {
  return {
    open: state.get("settings").get("isDisplayingHelpers")
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
