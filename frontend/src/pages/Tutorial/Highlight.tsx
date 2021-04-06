import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setTutorialHighlightStatusAction } from "actions/tutorial";
import { RootState } from "configureStore";
import Driver from "driver.js";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { TutorialHighlight } from "types/tutorial";

const styles = (theme: Theme) => createStyles({});

const mapStateToProps = (state: RootState, { highlight, highlightIndex, stepIndex }: OwnProps) => {
  const tutorialState = state.tutorial;
  const latestHighlight = tutorialState.latestHighlight;

  let notTriggered: boolean;

  if (!latestHighlight) {
    notTriggered = true;
  } else {
    const [prevStepIndex, prevHighlightIndex] = latestHighlight.split("-").map((x) => parseInt(x, 10));
    notTriggered = prevStepIndex < stepIndex || (prevStepIndex === stepIndex && prevHighlightIndex < highlightIndex);
  }

  let shouldTrigger: boolean = false;

  if (tutorialState.currentStepIndex === stepIndex && notTriggered && highlight.triggeredByState) {
    shouldTrigger = highlight.triggeredByState!(state);
  }

  return {
    shouldTrigger,
  };
};

interface OwnProps {
  highlight: TutorialHighlight;
  highlightIndex: number;
  stepIndex: number;
  driverOwner: { driver?: Driver };
}

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

class HighlightRaw extends React.PureComponent<Props> {
  componentDidUpdate() {
    this.update();
  }

  componentDidMount() {
    this.update();
  }

  componentWillUnmount(): void {
    const { driverOwner } = this.props;

    if (driverOwner.driver) {
      driverOwner.driver.reset();
    }
  }

  update = () => {
    const { dispatch, highlight, driverOwner, shouldTrigger, stepIndex, highlightIndex } = this.props;

    if (shouldTrigger) {
      console.log("shouldTrigger", stepIndex, highlightIndex);
      dispatch(setTutorialHighlightStatusAction(stepIndex, highlightIndex));

      const driver = new Driver({
        padding: 0,
        showButtons: false,
        animate: false,
      });

      const startedAt = new Date().getTime();
      let interval = window.setInterval(() => {
        if (new Date().getTime() - startedAt > 3110 || !driver) {
          window.clearInterval(interval);
          return;
        }

        let node = window.document.querySelector(highlight.anchor);

        if (!node) {
          return;
        }

        window.clearInterval(interval);
        driver!.highlight({
          element: highlight.anchor,
          popover: {
            title: highlight.title,
            description: highlight.description,
            position: highlight.position,
          },
        });
      }, 200);

      driverOwner.driver = driver;
    }
  };

  public render() {
    return null;
  }
}

export const Highlight = withStyles(styles)(connect(mapStateToProps)(HighlightRaw));
