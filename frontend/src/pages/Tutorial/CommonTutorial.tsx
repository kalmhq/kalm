import {
  Box,
  createStyles,
  FormGroup,
  Link,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Theme,
  Typography,
  withStyles,
  WithStyles,
  StepConnector,
} from "@material-ui/core";
import Driver from "driver.js";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "reducers";
import { TDispatchProp } from "types";
import { Loading } from "widgets/Loading";
import { TutorialSubStepCompoent } from "./TutorialSubStep";
import { Highlight } from "./Highlight";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    actionsContainer: {
      marginBottom: theme.spacing(2),
    },
    resetContainer: {
      padding: theme.spacing(3),
    },
    checkboxRoot: {
      padding: theme.spacing(0.75),
    },
    currentStep: {
      color: theme.palette.primary.main,
    },
    pastStep: {
      color: theme.palette.text.secondary,
      textDecoration: "line-through",
      fontStyle: "italic",
    },
    commingStep: {
      color: theme.palette.text.secondary,
    },

    // for steper connector
    connectorLineVertical: {
      minHeight: 10,
    },
  });

const mapStateToProps = (state: RootState) => {
  const tutorial = state.get("tutorial");
  return {
    currentStepIndex: tutorial.get("currentStepIndex"),
    tutorial: tutorial.get("tutorial")!,
    pathname: state
      .get("router")
      .get("location")
      .get("pathname") as string,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class CommonTutorialRaw extends React.PureComponent<Props, State> {
  driver?: Driver;

  componentDidUpdate(prevProps: Props) {
    // if (!(this.props.currentStepIndex === prevProps.currentStepIndex)) {
    //   if (this.driver) {
    //     this.driver.hasHighlightedElement();
    //     this.driver.reset();
    //     delete this.driver;
    //   }
    //   const currentStep = this.props.tutorial.steps[this.props.currentStepIndex];
    //   if (!currentStep) {
    //     return;
    //   }
    //   const currentSubStep = currentStep.subSteps[this.props.currentSubStepIndex];
    //   if (!currentSubStep || !currentSubStep.highlight) {
    //     return;
    //   }
    //   if (
    //     currentSubStep.highlight.requirePathname &&
    //     currentSubStep.highlight.requirePathname !== this.props.pathname
    //   ) {
    //     return;
    //   }
    //   if (
    //     currentSubStep.highlight.requirePathnamePrefix &&
    //     !this.props.pathname.startsWith(currentSubStep.highlight.requirePathnamePrefix)
    //   ) {
    //     return;
    //   }
    //   this.driver = new Driver({
    //     padding: 0,
    //     showButtons: false,
    //   });
    //   const startedAt = new Date().getTime();
    //   let interval = window.setInterval(() => {
    //     if (new Date().getTime() - startedAt > 3110 || !this.driver) {
    //       window.clearInterval(interval);
    //       return;
    //     }
    //     let node = window.document.querySelector(currentSubStep!.highlight!.anchor);
    //     if (!node) {
    //       return;
    //     } else {
    //       window.clearInterval(interval);
    //       this.driver!.highlight({
    //         element: currentSubStep!.highlight!.anchor,
    //         popover: {
    //           title: currentSubStep!.highlight!.title,
    //           description: currentSubStep.highlight!.description,
    //           position: currentSubStep!.highlight!.position,
    //         },
    //       });
    //       return;
    //     }
    //   }, 200);
    // }
  }

  componentWillUnmount() {
    if (this.driver) {
      this.driver.reset();
    }
  }

  public render() {
    const { classes, tutorial, currentStepIndex } = this.props;

    if (!tutorial) {
      return <Loading />;
    }

    return (
      <>
        <Box mb={2}>
          <Typography variant="h2">{tutorial.id}</Typography>
        </Box>
        <Stepper
          activeStep={currentStepIndex}
          orientation="vertical"
          style={{ padding: 0 }}
          connector={<StepConnector classes={{ lineVertical: classes.connectorLineVertical }} />}>
          {tutorial.steps.map((step, stepIndex) => (
            <Step key={step.name}>
              <StepLabel>{step.name}</StepLabel>
              <StepContent>
                <Typography>{step.description}</Typography>
                <Box ml={2} mt={1}>
                  <FormGroup>
                    {step.subSteps.map((subStep, subStepIndex) => (
                      <TutorialSubStepCompoent
                        key={`${stepIndex}-${subStepIndex}`}
                        subStep={subStep}
                        stepIndex={stepIndex}
                        subStepIndex={subStepIndex}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </StepContent>
              {step.highlights.map((highlight, highlightIndex) => (
                <Highlight
                  key={`${stepIndex}-${highlightIndex}`}
                  highlight={highlight}
                  highlightIndex={highlightIndex}
                  stepIndex={stepIndex}
                  driverOwner={this}
                />
              ))}
            </Step>
          ))}
        </Stepper>
        {currentStepIndex >= tutorial.steps.length && tutorial.nextStep && (
          <Box mt={2}>
            <Typography>Congratulations, you have completed this tutorial!</Typography>
            <Typography>
              Next step:{" "}
              <Link component="button" onClick={tutorial.nextStep.onClick}>
                {tutorial.nextStep.text}
              </Link>
            </Typography>
          </Box>
        )}
      </>
    );
  }
}

export const CommonTutorial = withStyles(styles)(connect(mapStateToProps)(CommonTutorialRaw));
