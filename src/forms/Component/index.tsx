import {
  Button,
  Grid,
  List as MList,
  ListItem,
  ListItemText,
  Paper
} from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { connect } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { InjectedFormProps } from "redux-form";
import { getFormValues, reduxForm } from "redux-form/immutable";
import { Component } from "../../actions";
import { RootState } from "../../reducers";
import { CustomTextField } from "../Basic";
import { CustomEnvs } from "../Basic/env";
import { CustomPorts } from "../Basic/ports";
import { ValidatorRequired } from "../validator";
import ComponentResources from "./resources";

export interface Props {}

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(5)
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 400
  },
  sectionDiscription: {
    fontSize: 16,
    margin: "16px 0"
  },
  input: {
    marginBottom: 12
  }
}));

const mapStateToProps = (state: RootState) => {
  const values = getFormValues("component")(state) as Component;
  return {
    values
  };
};

function ComponentTemplateFormRaw(
  props: Props &
    InjectedFormProps<Component, Props> &
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
            <Typography classes={{ root: classes.sectionDiscription }}>
              Describe how to launch this compoent.
            </Typography>
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
            </Paper>
            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Environment variables
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Environment variables are variable whose values are set outside
              the program, typically through functionality built into the
              component. An environment variable is made up of a name/value
              pair, it also support combine a dynamic value associated with
              other component later in a real running application. Learn More.
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
            </Typography>
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
            <Typography classes={{ root: classes.sectionDiscription }}>
              Port is the standard way to expose your program. If you want your
              component can be accessed by some other parts, you need to define
              a port.
            </Typography>
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
            <Typography classes={{ root: classes.sectionDiscription }}>
              Cpu, Memory, Disk can be configured here.
            </Typography>
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
              Component Data
            </Typography>

            <SyntaxHighlighter language="json" style={monokai}>
              {JSON.stringify(props.values, undefined, 2)}
            </SyntaxHighlighter>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}

export const ComponentTemplateForm = reduxForm<Component, Props>({
  form: "component",
  onSubmitFail: console.log
})(connect(mapStateToProps)(ComponentTemplateFormRaw));
