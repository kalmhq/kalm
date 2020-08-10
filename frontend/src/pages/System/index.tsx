import React from "react";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { TDispatchProp } from "types";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { BasePage } from "pages/BasePage";
import Box from "@material-ui/core/Box";

const styles = (theme: Theme) =>
  createStyles({
    root: {},
  });

const mapStateToProps = (state: RootState) => {
  return {};
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class FirstSetupPageRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public render() {
    return (
      <BasePage>
        <Box p={2}>System page</Box>
      </BasePage>
    );
  }
}

export const SystemPage = withStyles(styles)(connect(mapStateToProps)(FirstSetupPageRaw));
