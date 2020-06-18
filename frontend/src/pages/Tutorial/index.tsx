import {
  Box,
  createStyles,
  Drawer,
  IconButton,
  Link,
  Theme,
  Typography,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import KeyboardBackspaceIcon from "@material-ui/icons/KeyboardBackspace";
import { closeTutorialDrawerAction, resetTutorialAction, setTutorialAction } from "actions/tutorial";
import clsx from "clsx";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { CreateApplicationTutorialFactory } from "types/tutorial";
import { Body } from "widgets/Label";
import { CommonTutorial } from "./CommonTutorial";
import { loadApplicationsAction } from "actions/application";

export const tutorialDrawerWidth: number = 400;

const styles = (theme: Theme) => {
  return createStyles({
    root: {},
    list: {},
    drawer: {
      width: tutorialDrawerWidth,
      flexShrink: 0,
      // greater than driver.js overlay z-index
      // make this part visible when the driver.js is actived
    },
    drawerHighZIndex: {
      zIndex: 100004,
    },
    drawerPaper: {
      width: tutorialDrawerWidth,
      padding: theme.spacing(2),
    },
  });
};

const mapStateToProps = (state: RootState) => {
  return {
    toturialID: state.get("tutorial").get("tutorialID"),
    drawerOpen: state.get("tutorial").get("drawerOpen"),
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class TutorialRaw extends React.PureComponent<Props, State> {
  private handleChooseCreateApplicationTutorial = async () => {
    const { dispatch } = this.props;
    const applications = await dispatch(loadApplicationsAction());

    const sampleNameTemplate = "hello-world-";
    let i = 0;
    let sampleName = "hello-world";
    while (applications.find(app => app.get("name") === sampleName)) {
      i += 1;
      sampleName = sampleNameTemplate + i;
    }
    // sampleName = "hello-world";
    dispatch(setTutorialAction("CreateApplicationTutorial", CreateApplicationTutorialFactory(sampleName)));
  };

  private renderOptions = () => {
    return (
      <div>
        {/* <Box mb={2}>
          <Typography variant="h3">Congratulations! </Typography>
          <Body>You have successfully installed Kapp on your cluster.</Body>
          <Body>Choose a tutorial you are interested in, learn how to use kapp dashboard.</Body>
        </Box> */}
        <Box mb={2}>
          <Typography variant="h3">Tutorials</Typography>
          <Body>Here are some live tutorials that walk you throught some common tasks step by step. </Body>
        </Box>
        <Box mb={2}>
          <Typography variant="h5">Basic</Typography>
        </Box>
        <Box mb={2}>
          <Link component="button" variant="body2" onClick={this.handleChooseCreateApplicationTutorial}>
            Deploy an application.
          </Link>
          <br />
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              console.info("I'm a button.");
            }}>
            Access an application from public internet.
          </Link>
          <br />
        </Box>
        <Box mb={1}>
          <Typography variant="h5">Advanced</Typography>
        </Box>
        <Box mb={2}>
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              console.info("I'm a button.");
            }}>
            Configure https certifate.
          </Link>
          <br />
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              console.info("I'm a button.");
            }}>
            Connect to private docker image registry.
          </Link>
          <br />
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              console.info("I'm a button.");
            }}>
            Use disks in your applications.
          </Link>
          <br />
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              console.info("I'm a button.");
            }}>
            Integration with your CI pipeline.
          </Link>
          <br />
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              console.info("I'm a button.");
            }}>
            I'm an Kubernetes expert.
          </Link>
          <br />
        </Box>

        <Box mt={2}>
          <Link
            color="textSecondary"
            href="https://github.com/kapp-staging/kapp/issues/new"
            target="_blank"
            rel="noreferer">
            Still have questions? Tell us!
          </Link>
        </Box>
        {/* This tutorial will walk you through kapp dashboard */}
        {/* <Body>
          With following this example, you will be able to deploy a demo project called Bookinfo, you can access it from
          public network.
        </Body> */}
      </div>
    );
  };

  private handlerClose = () => {
    const { dispatch } = this.props;
    dispatch(resetTutorialAction());
    dispatch(closeTutorialDrawerAction());
  };

  private handleBack = () => {
    const { dispatch } = this.props;
    dispatch(resetTutorialAction());
  };

  public render() {
    const { classes, toturialID, drawerOpen } = this.props;

    return (
      <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        className={clsx(classes.drawer, { [classes.drawerHighZIndex]: drawerOpen })}
        classes={{
          paper: classes.drawerPaper,
        }}>
        <Box textAlign="right">
          {toturialID ? (
            <IconButton aria-label="close" onClick={this.handleBack}>
              <KeyboardBackspaceIcon />
            </IconButton>
          ) : null}
          <IconButton aria-label="close" onClick={this.handlerClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {toturialID === "" ? this.renderOptions() : <CommonTutorial />}
      </Drawer>
    );
  }
}

export const Tutorial = withStyles(styles)(connect(mapStateToProps)(TutorialRaw));
