import {
  Box,
  Collapse,
  createStyles,
  Drawer,
  IconButton,
  Theme,
  Typography,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import KeyboardBackspaceIcon from "@material-ui/icons/KeyboardBackspace";
import { closeTutorialDrawerAction, resetTutorialAction, setTutorialAction } from "actions/tutorial";
import clsx from "clsx";
import { RootState } from "configureStore";
import { DRAWER_HIGH_ZINDEX, TUTORIAL_DRAWER_WIDTH } from "layout/Constants";
import React from "react";
import { connect } from "react-redux";
import { tutorialConfigs } from "tutorials";
import { TDispatchProp } from "types";
import { Tutorial, TutorialFactory } from "types/tutorial";
import { Body } from "widgets/Label";
import { KMLink } from "widgets/Link";
import { CommonTutorial } from "./CommonTutorial";

class TutorialItem extends React.PureComponent<{
  title: string;
  factory: TutorialFactory;
  onClick: any;
}> {
  private handleClick = () => {
    const tutorial = this.props.factory(this.props.title);
    this.props.onClick(tutorial);
  };

  public render() {
    return (
      <>
        <KMLink component="button" variant="body2" onClick={this.handleClick}>
          {this.props.title}
        </KMLink>
        <br />
      </>
    );
  }
}

const styles = (theme: Theme) => {
  return createStyles({
    root: {},
    list: {},
    drawer: {
      width: TUTORIAL_DRAWER_WIDTH,
      flexShrink: 0,
      // greater than driver.js overlay z-index
      // make this part visible when the driver.js is actived
    },
    drawerHighZIndex: {
      zIndex: DRAWER_HIGH_ZINDEX,
    },
    drawerPaper: {
      width: TUTORIAL_DRAWER_WIDTH,
      padding: theme.spacing(2),
    },
  });
};

const mapStateToProps = (state: RootState) => {
  return {
    tutorial: state.tutorial.tutorial,
    applications: state.applications,
    drawerOpen: state.tutorial.drawerOpen,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class TutorialRaw extends React.PureComponent<Props, State> {
  private handleChoice = (tutorial: Tutorial) => {
    this.props.dispatch(setTutorialAction(tutorial));
  };

  private renderOptions = () => {
    return (
      <div>
        <Box mb={2}>
          <Typography variant="h4">Tutorials</Typography>
          <Body>Here are some live tutorials that walk you throught some common tasks step by step. </Body>
        </Box>
        {tutorialConfigs.map((group) => (
          <React.Fragment key={group.name}>
            <Box mb={2}>
              <Typography variant="h6">{group.name}</Typography>
            </Box>
            <Box mb={2}>
              {group.items.map((item) => {
                return (
                  <TutorialItem title={item.name} factory={item.factory} onClick={this.handleChoice} key={item.name} />
                );
              })}
            </Box>
          </React.Fragment>
        ))}

        <Box mt={2}>
          <KMLink
            color="textSecondary"
            href="https://github.com/kalmHQ/kalm/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            Still have questions? Tell us!
          </KMLink>
        </Box>
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
    const { classes, tutorial, drawerOpen } = this.props;

    return (
      <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        className={clsx(classes.drawer, { [classes.drawerHighZIndex]: drawerOpen })}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Box textAlign="right">
          {tutorial && (
            <IconButton aria-label="close" onClick={this.handleBack}>
              <KeyboardBackspaceIcon />
            </IconButton>
          )}
          <IconButton aria-label="close" onClick={this.handlerClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Collapse in={!tutorial}>{this.renderOptions()}</Collapse>
        <Collapse in={!!tutorial}>
          <CommonTutorial />
        </Collapse>
      </Drawer>
    );
  }
}

export const TutorialDrawer = withStyles(styles)(connect(mapStateToProps)(TutorialRaw));
