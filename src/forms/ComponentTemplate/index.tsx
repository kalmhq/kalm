import { Box, Button, Grid, List as MList, ListItem, ListItemText, MenuItem, Paper } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { connect } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, getFormValues, reduxForm } from "redux-form/immutable";
import { ComponentTemplate, workloadTypeCronjob, workloadTypeServer } from "../../actions";
import { convertToCRDComponentTemplate } from "../../convertors/ComponentTemplate";
import { RootState } from "../../reducers";
import { HelperContainer } from "../../widgets/Helper";
import { CustomTextField, RenderSelectField, RenderTextField } from "../Basic";
import { CustomEnvs } from "../Basic/env";
import { CustomPorts } from "../Basic/ports";
import { ValidatorRequired, ValidatorSchedule } from "../validator";
import ComponentResources from "./resources";
import { TabDataView } from "./TabDataView";

const mapStateToProps = (state: RootState) => {
  const values = getFormValues("component")(state) as ComponentTemplate;
  return {
    values
  };
};

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      width: "100%"
      // backgroundColor: theme.palette.background.paper
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(5)
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: 400,
      marginBottom: 16
    },
    input: {
      marginBottom: 12
    }
  });

export interface Props
  extends InjectedFormProps<ComponentTemplate, {}>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles> {}

class ComponentTemplateFormRaw extends React.PureComponent<Props> {
  private renderSchedule = () => {
    if (this.props.values.get("workloadType") !== workloadTypeCronjob) {
      return null;
    }

    return (
      <>
        <Box mt={3}></Box>
        <Field
          name="schedule"
          component={RenderTextField}
          placeholder="* * * * * *"
          label="Cronjob Schedule"
          required
          validate={[ValidatorSchedule]}
          helperText={
            <span>
              <a href="https://en.wikipedia.org/wiki/Cron" target="_blank" rel="noopener noreferrer">
                Cron
              </a>{" "}
              format string.
            </span>
          }
        />
      </>
    );
  };

  private renderBasic() {
    const { classes, values } = this.props;
    const isEdit = !!values.get("resourceVersion");
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Basic
        </Typography>
        <HelperContainer>
          <Typography>Describe how to launch this compoent.</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <CustomTextField
            // className={classes.input}
            name="name"
            label="Name"
            margin
            validate={[ValidatorRequired]}
            disabled={isEdit}
            helperText={
              isEdit
                ? "Name can't be changed."
                : 'The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
            }
            placeholder="Please type the component name"
          />
          <CustomTextField
            // className={classes.input}
            name="image"
            label="Image"
            margin
            validate={[ValidatorRequired]}
            helperText='Eg: "nginx:latest", "registry.example.com/group/repo:tag"'
          />
          <CustomTextField
            name="command"
            margin
            label="Command (Optional)"
            helperText='Eg: "/bin/app", "rails server".'
          />
          <Box mt={3}></Box>
          <Field name="workloadType" component={RenderSelectField} label="Workload Type" validate={[ValidatorRequired]}>
            <MenuItem value={workloadTypeServer}>Server (continuous running)</MenuItem>
            <MenuItem value={workloadTypeCronjob}>Cronjob (periodic running)</MenuItem>
          </Field>
          {this.renderSchedule()}
        </Paper>
      </>
    );
  }

  private renderEnvs() {
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Environment variables
        </Typography>
        <HelperContainer>
          <Typography>
            Environment variables are variable whose values are set outside the program, typically through functionality
            built into the component. An environment variable is made up of a name/value pair, it also support combine a
            dynamic value associated with other component later in a real running application. Learn More.
          </Typography>
          <MList dense={true}>
            <ListItem>
              <ListItemText primary="Static" secondary={"A constant value environment variable."} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="External"
                secondary={
                  "Value will be set in an application later. External variable with the same name will be consistent across all components in the same application."
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Linked"
                secondary={
                  "Value will be set in an application later. Linked variable can only be set as another component exposed port address in the same application."
                }
              />
            </ListItem>
          </MList>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <CustomEnvs />
        </Paper>
      </>
    );
  }

  public renderPorts() {
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Ports
        </Typography>
        <HelperContainer>
          <Typography>
            Port is the standard way to expose your program. If you want your component can be accessed by some other
            parts, you need to define a port.
          </Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <CustomPorts />
        </Paper>
      </>
    );
  }

  private renderResources() {
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Resources
        </Typography>
        <HelperContainer>
          <Typography>Cpu, Memory, Disk can be configured here.</Typography>
          <MList dense={true}>
            <ListItem>
              <ListItemText
                primary="CPU"
                secondary={
                  "Fractional values are allowed. A Container that requests 0.5 CPU is guaranteed half as much CPU as a Container that requests 1 CPU. You can use the suffix m to mean milli. For example 100m CPU, 100 milliCPU, and 0.1 CPU are all the same. Precision finer than 1m is not allowed. CPU is always requested as an absolute quantity, never as a relative quantity; 0.1 is the same amount of CPU on a single-core, dual-core, or 48-core machine."
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Memory"
                secondary={
                  "The memory resource is measured in bytes. You can express memory as a plain integer or a fixed-point integer with one of these suffixes: E, P, T, G, M, K, Ei, Pi, Ti, Gi, Mi, Ki. For example, the following represent approximately the same value:"
                }
              />
            </ListItem>
          </MList>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <ComponentResources />
        </Paper>
      </>
    );
  }

  public render() {
    const { handleSubmit, values, classes } = this.props;
    // const classes = useStyles();
    // const [value, setValue] = React.useState(0);

    // const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    //   setValue(newValue);
    // };

    return (
      <div className={classes.root}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
              {this.renderBasic()}
              {this.renderEnvs()}
              {this.renderPorts()}
              {this.renderResources()}
            </Grid>

            <Grid item xs={12} sm={12} md={4} lg={4} xl={6}>
              <Typography
                variant="h2"
                classes={{
                  root: classes.sectionHeader
                }}>
                Data View
              </Typography>
              <TabDataView
                tabOptions={[
                  { title: "Kapp JSON", language: "json", content: JSON.stringify(values, undefined, 2) },
                  {
                    title: "k8s CRD",
                    language: "json",
                    content: JSON.stringify(convertToCRDComponentTemplate(values), undefined, 2)
                  }
                ]}
              />
            </Grid>
          </Grid>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
        </form>
      </div>
    );
  }
}

export const ComponentTemplateForm = reduxForm<ComponentTemplate, {}>({
  form: "component",
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(ComponentTemplateFormRaw)));
