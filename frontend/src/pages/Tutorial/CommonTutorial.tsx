import {
  Box,
  createStyles,
  FormGroup,
  Step,
  StepConnector,
  StepContent,
  StepLabel,
  Stepper,
  Theme,
  Typography,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import Driver from "driver.js";
import React from "react";
import { connect } from "react-redux";
import { RootState } from "store";
import { TDispatchProp } from "types";
import { KMLink } from "widgets/Link";
import { Loading } from "widgets/Loading";
import { Highlight } from "./Highlight";
import { TutorialSubStepCompoent } from "./TutorialSubStep";

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
  const tutorial = state.tutorial;
  return {
    currentStepIndex: tutorial.currentStepIndex,
    tutorial: tutorial.tutorial!,
  };
};

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp {}

interface State {}

class CommonTutorialRaw extends React.PureComponent<Props, State> {
  // used as a store of children highlight elements
  driver?: Driver;

  componentWillUnmount() {
    if (this.driver) {
      this.driver.reset();
    }
  }

  public render() {
    const { classes, tutorial, currentStepIndex } = this.props;

    if (!tutorial) {
      return (
        <Box flex="1">
          <Loading />
        </Box>
      );
    }

    return (
      <>
        <Box mb={2}>
          <Typography variant="h4">{tutorial.title}</Typography>
        </Box>
        <Stepper
          activeStep={currentStepIndex}
          orientation="vertical"
          style={{ padding: 0 }}
          connector={<StepConnector classes={{ lineVertical: classes.connectorLineVertical }} />}
        >
          {tutorial.steps.map((step, stepIndex) => (
            <Step key={step.name}>
              <StepLabel error={!!step.error}>{step.name}</StepLabel>
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
              <KMLink component="button" onClick={tutorial.nextStep.onClick}>
                {tutorial.nextStep.text}
              </KMLink>
            </Typography>
          </Box>
        )}
      </>
    );
  }
}

export const CommonTutorial = withStyles(styles)(connect(mapStateToProps)(CommonTutorialRaw));
