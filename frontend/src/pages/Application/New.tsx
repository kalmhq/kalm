import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { ThunkDispatch } from "redux-thunk";
import { Actions } from "types";
import { H6 } from "widgets/Label";
import ApplicationForm from "../../forms/Application";
import { BasePage } from "../BasePage";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      height: "100%",
    },
  });

interface Props extends WithStyles<typeof styles> {
  dispatch: ThunkDispatch<RootState, undefined, Actions>;
}

class ApplicationNewRaw extends React.PureComponent<Props> {
  public render() {
    const { classes } = this.props;
    return (
      <BasePage secondHeaderRight={<H6>Create Application</H6>}>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={8} md={8}>
              <ApplicationForm currentTab={"basic"} />
            </Grid>
          </Grid>
        </div>
      </BasePage>
    );
  }
}

export const ApplicationNewPage = withStyles(styles)(connect()(ApplicationNewRaw));
