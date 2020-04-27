import React from "react";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Collapse from "@material-ui/core/Collapse";
import { BasePage } from "../BasePage";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%"
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1)
    },
    actionsContainer: {
      marginBottom: theme.spacing(2)
    },
    resetContainer: {
      padding: theme.spacing(3)
    }
  })
);

// function getSteps() {
//   return ["Install DAE", "Install Modules", "Create an ad"];
// }

interface Step {
  title: string;
  content: React.ReactChild;
  hasNext: boolean;
  hasPrivate: boolean;
  isOptional: boolean;
}

const IntallDaeContent: React.FunctionComponent<any> = () => {
  return (
    <div>
      Congratulations. You have successfully run DAE on your cluster. Now, please follow the steps to finish the
      installment process. It will take you about 5-20 minutes (depend on your network).
    </div>
  );
};

const ConfigureImageRegistry: React.FunctionComponent = () => {
  const classes = makeStyles(theme => ({
    root: {
      height: 180
    },
    container: {
      display: "flex"
    },
    paper: {
      margin: theme.spacing(1)
    },
    svg: {
      width: 100,
      height: 100
    },
    polygon: {
      fill: theme.palette.common.white,
      stroke: theme.palette.divider,
      strokeWidth: 1
    }
  }))();

  const [checked, setChecked] = React.useState(false);

  const handleChange = () => {
    setChecked(prev => !prev);
  };

  return (
    <div>
      <div onClick={handleChange}>Why</div>
      <Collapse in={checked}>
        <Paper elevation={1} className={classes.paper}>
          <svg className={classes.svg}>
            <polygon points="0,100 50,00, 100,100" className={classes.polygon} />
          </svg>
        </Paper>
      </Collapse>
      For each ad campaign that you create, you can control how much you're willing to spend on clicks and conversions,
      which networks and geographical locations you want your ads to show on, and more.
    </div>
  );
};

const fullSteps: Step[] = [
  {
    title: "Install DAE",
    content: <IntallDaeContent />,
    hasNext: true,
    hasPrivate: false,
    isOptional: true
  },
  {
    title: "Configure Image Registry",
    content: <ConfigureImageRegistry />,
    hasNext: true,
    hasPrivate: false,
    isOptional: true
  },
  {
    title: "Finished!",
    content: `You are good to go.`,
    hasNext: true,
    hasPrivate: false,
    isOptional: true
  }
];

// function getStepContent(step: number) {
//   switch (step) {
//     case 0:
//       return `For each ad campaign that you create, you can control how much
//               you're willing to spend on clicks and conversions, which networks
//               and geographical locations you want your ads to show on, and more.`;
//     case 1:
//       return "An ad group contains one or more ads which target a shared set of keywords.";
//     case 2:
//       return `Try out different ad text to see what brings in the most customers,
//               and learn how to enhance your ads using features like ad extensions.
//               If you run into any problems with your ads, find out how to tell if
//               they're running and how to resolve approval issues.`;
//     default:
//       return "Unknown step";
//   }
// }

export default function InstallPage() {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = fullSteps;

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  // const handleReset = () => {
  //   setActiveStep(0);
  // };

  return (
    <BasePage>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.title}>
            <StepLabel>{step.title}</StepLabel>
            <StepContent>
              <Typography>{step.content}</Typography>
              <div className={classes.actionsContainer}>
                <div>
                  {step.hasPrivate ? (
                    <Button disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                      {" "}
                      Back
                    </Button>
                  ) : null}

                  {step.hasNext ? (
                    <Button variant="contained" color="primary" onClick={handleNext} className={classes.button}>
                      {activeStep === steps.length - 1 ? "Finish" : "Next"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </BasePage>
  );
}
