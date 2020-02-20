import {
  Box,
  Button,
  Grid,
  List as MList,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  MenuItem
} from "@material-ui/core";
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { connect } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { InjectedFormProps } from "redux-form";
import { Field } from "redux-form/immutable";
import { getFormValues, reduxForm } from "redux-form/immutable";
import {
  ComponentTemplate,
  workloadTypeCronjob,
  workloadTypeServer
} from "../../actions";
import { convertToCRDComponentTemplate } from "../../convertors/ComponentTemplate";
import { RootState } from "../../reducers";
import { CustomTextField, RenderSelectField, RenderTextField } from "../Basic";
import { CustomEnvs } from "../Basic/env";
import { CustomPorts } from "../Basic/ports";
import { ValidatorRequired, ValidatorSchedule } from "../validator";
import ComponentResources from "./resources";
import { HelperContainer } from "../../widgets/Helper";

export interface Props {}

const useStyles = makeStyles((theme: Theme) => ({
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
}));

const mapStateToProps = (state: RootState) => {
  const values = getFormValues("component")(state) as ComponentTemplate;
  return {
    values
  };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-prevent-tabpanel-${index}`}
      aria-labelledby={`scrollable-prevent-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </Typography>
  );
}

interface StyledTabsProps {
  value: number;
  onChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
}

const StyledTabs = withStyles({
  indicator: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent",
    "& > div": {
      width: "100%",
      backgroundColor: "#635ee7"
    }
  }
})((props: StyledTabsProps) => (
  <Tabs {...props} TabIndicatorProps={{ children: <div /> }} />
));

interface StyledTabProps {
  label: string;
}

const StyledTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: "none",
      fontWeight: theme.typography.fontWeightRegular,
      fontSize: theme.typography.pxToRem(15),
      marginRight: theme.spacing(1),
      "&:focus": {
        opacity: 1
      }
    }
  })
)((props: StyledTabProps) => <Tab disableRipple {...props} />);

const RenderSchedule = (
  props: Pick<ReturnType<typeof mapStateToProps>, "values">
) => {
  if (props.values.get("workloadType") !== workloadTypeCronjob) {
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
            <a
              href="https://en.wikipedia.org/wiki/Cron"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cron
            </a>{" "}
            format string.
          </span>
        }
      />
    </>
  );
};

function ComponentTemplateFormRaw(
  props: Props &
    InjectedFormProps<ComponentTemplate, Props> &
    ReturnType<typeof mapStateToProps>
) {
  const { handleSubmit, values } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };
  const isEdit = !!values.get("resourceVersion");
  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
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
              }}
            >
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
              <Field
                name="workloadType"
                component={RenderSelectField}
                label="Workload Type"
                validate={[ValidatorRequired]}
              >
                <MenuItem value={workloadTypeServer}>
                  Server (continuous running)
                </MenuItem>
                <MenuItem value={workloadTypeCronjob}>
                  Cronjob (periodic running)
                </MenuItem>
              </Field>
              {RenderSchedule({ values })}
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Environment variables
            </Typography>
            <HelperContainer>
              <Typography>
                Environment variables are variable whose values are set outside
                the program, typically through functionality built into the
                component. An environment variable is made up of a name/value
                pair, it also support combine a dynamic value associated with
                other component later in a real running application. Learn More.
              </Typography>
              <MList dense={true}>
                <ListItem>
                  <ListItemText
                    primary="Static"
                    secondary={"A constant value environment variable."}
                  />
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
              }}
            >
              <CustomEnvs />
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Ports
            </Typography>
            <HelperContainer>
              <Typography>
                Port is the standard way to expose your program. If you want
                your component can be accessed by some other parts, you need to
                define a port.
              </Typography>
            </HelperContainer>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <CustomPorts />
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
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
              }}
            >
              <ComponentResources />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={12} md={4} lg={4} xl={6}>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Data View
            </Typography>

            <div>
              <StyledTabs
                value={value}
                onChange={handleChange}
                aria-label="styled tabs example"
              >
                <StyledTab label="Kapp JSON" />
                <StyledTab label="K8s CRD" />
              </StyledTabs>
              <TabPanel value={value} index={0}>
                <SyntaxHighlighter
                  language="json"
                  style={monokai}
                  showLineNumbers
                >
                  {JSON.stringify(props.values, undefined, 2)}
                </SyntaxHighlighter>
              </TabPanel>
              <TabPanel value={value} index={1}>
                <SyntaxHighlighter
                  language="json"
                  style={monokai}
                  showLineNumbers
                >
                  {JSON.stringify(
                    convertToCRDComponentTemplate(props.values),
                    undefined,
                    2
                  )}
                </SyntaxHighlighter>
              </TabPanel>
            </div>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}

export const ComponentTemplateForm = reduxForm<ComponentTemplate, Props>({
  form: "component",
  onSubmitFail: console.log
})(connect(mapStateToProps)(ComponentTemplateFormRaw));
