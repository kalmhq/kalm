import { Checkbox, createStyles, FormControlLabel, Theme, withStyles, WithStyles } from "@material-ui/core";
import { setTutorialStepCompletionStatusAction } from "actions/tutorial";
import clsx from "clsx";
import { RootState } from "configureStore";
import React from "react";
import { connect } from "react-redux";
import { TDispatchProp } from "types";
import { TutorialSubStep } from "types/tutorial";

const styles = (theme: Theme) =>
  createStyles({
    uncompletedStep: {
      color: theme.palette.primary.main,
    },
    completedStep: {
      color: theme.palette.text.secondary,
      textDecoration: "line-through",
      fontStyle: "italic",
    },
    checkboxRoot: {
      padding: theme.spacing(0.75),
    },
  });

const mapStateToProps = (state: RootState, { subStep, stepIndex, subStepIndex }: OwnProps) => {
  const currentStepIndex = state.tutorial.currentStepIndex;
  let completionByState =
    subStep.shouldCompleteByState && currentStepIndex === stepIndex ? subStep.shouldCompleteByState(state) : false;

  return {
    definedCompletionByState: !!subStep.shouldCompleteByState,
    completionByState,
    isCompleted: !!state.tutorial.tutorialStepStatus[`${stepIndex}-${subStepIndex}`],
  };
};

interface OwnProps {
  subStep: TutorialSubStep;
  stepIndex: number;
  subStepIndex: number;
}

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps>, TDispatchProp, OwnProps {}

interface State {}

class TutorialSubStepCompoentRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate() {
    this.updateCompletionStatus();
  }

  componentDidMount() {
    this.updateCompletionStatus();
  }

  updateCompletionStatus = () => {
    const {
      completionByState,
      definedCompletionByState,
      isCompleted,
      dispatch,
      stepIndex,
      subStepIndex,
      subStep,
    } = this.props;

    if (!definedCompletionByState) {
      return;
    }

    if (isCompleted && subStep.irrevocable) {
      return;
    }

    if (completionByState !== isCompleted) {
      dispatch(setTutorialStepCompletionStatusAction(stepIndex, subStepIndex, completionByState));
    }
  };

  public render() {
    const { classes, isCompleted, subStep } = this.props;
    return (
      <FormControlLabel
        style={{
          cursor: "auto",
        }}
        className={clsx({
          [classes.uncompletedStep]: !isCompleted,
          [classes.completedStep]: isCompleted,
        })}
        control={
          <Checkbox
            style={{
              cursor: "auto",
            }}
            disableRipple
            disableTouchRipple
            disableFocusRipple
            tabIndex={-1}
            size="small"
            color="primary"
            classes={{ root: classes.checkboxRoot }}
            checked={isCompleted}
          />
        }
        label={subStep.title}
      />
    );
  }
}

export const TutorialSubStepCompoent = withStyles(styles)(connect(mapStateToProps)(TutorialSubStepCompoentRaw));
