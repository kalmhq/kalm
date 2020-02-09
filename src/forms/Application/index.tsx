import { Button, Grid, Paper } from "@material-ui/core";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { InjectedFormProps, reduxForm } from "redux-form";
import { ComponentFormValues } from "../../actions";
import { CustomTextField } from "../Basic";
import { ValidatorRequired } from "../validator";
import { Components } from "./component";
import { ApplicationSharedEnvs } from "../Basic/env";

export interface Props {}

const useStyles = makeStyles((theme: Theme) => ({
  sectionHeader: {
    fontSize: 24,
    fontWeight: 400
  },
  sectionDiscription: {
    fontSize: 16,
    margin: "16px 0"
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(5)
  }
}));

function ApplicationFormRaw(
  props: Props & InjectedFormProps<ComponentFormValues, Props>
) {
  const { handleSubmit } = props;
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={1}>
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
              Basic information of this application
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <CustomTextField
                name="name"
                label="Name"
                margin
                validate={ValidatorRequired}
                helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
                placeholder="Please type the component name"
              />
            </Paper>

            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Components
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Select compoents you want to include into this application.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <Components />
            </Paper>

            <Typography
              variant="h2"
              classes={{
                root: classes.sectionHeader
              }}
            >
              Shared Environment Variables
            </Typography>
            <Typography classes={{ root: classes.sectionDiscription }}>
              Shared environment variable is consistent amoung all components.
            </Typography>
            <Paper
              elevation={4}
              square
              classes={{
                root: classes.paper
              }}
            >
              <ApplicationSharedEnvs />
            </Paper>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
}

const initialValues = {
  name: "",
  sharedEnv: [],
  components: [
    {
      id: "0",
      name: "test",
      image: "test.com/test:latest",
      command: "/bin/runapp",
      env: [
        { name: "static-name", type: "static", value: "foo-value" },
        { type: "external", value: "", name: "external" }
      ],
      ports: [
        { name: "http", protocol: "TCP", containerPort: 8080, servicePort: 80 }
      ],
      cpu: 2600,
      memory: 2000,
      disk: [
        {
          name: "test",
          type: "new",
          path: "123",
          existDisk: "",
          size: "300",
          storageClass: "external"
        },
        {
          name: "",
          type: "existing",
          path: "23123",
          existDisk: "1",
          size: "",
          storageClass: ""
        }
      ]
    }
  ]
};

export default reduxForm<ComponentFormValues, Props>({
  form: "application",
  initialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(ApplicationFormRaw);
