import { Button, Grid, Paper } from "@material-ui/core";

import Box from "@material-ui/core/Box";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { reduxForm } from "redux-form/immutable";
import { InjectedFormProps } from "redux-form";
import { getFormValues } from "redux-form/immutable";
import { Component } from "../../actions";
import { CustomTextField } from "../Basic";
import { CustomEnvs } from "../Basic/env";
import { CustomPorts } from "../Basic/ports";
import { ValidatorRequired } from "../validator";
import ComponentResources from "./resources";
import { RootState } from "../../reducers";
import { connect } from "react-redux";

import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";

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

function ComponentFormRaw(
  props: Props &
    InjectedFormProps<Component, Props> &
    ReturnType<typeof mapStateToProps>
) {
  const { handleSubmit } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

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
                helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
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

export default reduxForm<Component, Props>({
  form: "component",
  onSubmitFail: console.log
})(connect(mapStateToProps)(ComponentFormRaw));
