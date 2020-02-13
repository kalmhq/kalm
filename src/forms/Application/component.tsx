import {
  Box,
  Button,
  Chip,
  Collapse,
  createStyles,
  Divider,
  Grid,
  Grow,
  MenuItem,
  Theme,
  Typography,
  WithStyles,
  withStyles
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import Immutable from "immutable";
import React from "react";
import { connect } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray, formValueSelector } from "redux-form/immutable";
import { Component, SharedEnv } from "../../actions";
import { RootState } from "../../reducers";
import { RenderAutoCompleteSelect } from "../Basic";
import { EnvTypeExternal, EnvTypeStatic } from "../Basic/env";
import { EnvList } from "./envList";

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const sharedEnv: Immutable.List<SharedEnv> = selector(state, "sharedEnv");

  return {
    components: state.get("components").get("components"),
    sharedEnv
  };
};

type stateProps = ReturnType<typeof mapStateToProps>;

const styles = (theme: Theme) =>
  createStyles({
    delete: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    inputForm: {
      border: `1px dashed`,
      padding: theme.spacing(3),
      borderRadius: 3
    }
  });

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}
interface Props
  extends WrappedFieldArrayProps<Component>,
    WithStyles<typeof styles>,
    stateProps,
    FieldArrayComponentHackType {}

interface State {
  isFormOpen: boolean;
  open: boolean;
  isAddButtonDisplayed: boolean;
}

class RenderComponents extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isFormOpen: false,
      open: false,
      isAddButtonDisplayed: true
    };
  }

  public render() {
    const {
      fields,
      meta: { error, submitFailed },
      components,
      classes,
      sharedEnv
    } = this.props;

    const { isFormOpen, isAddButtonDisplayed, open } = this.state;

    const componentsArray = components.toList().toArray();

    const componentsIdAndNames = componentsArray.map(component => {
      return {
        value: component.get("id"),
        text: component.get("name")
      };
    });

    const isEnvInSharedEnv = (envName: string) => {
      return !!sharedEnv.find(x => x.get("name") === envName);
    };

    return (
      <div>
        <div>{submitFailed && error && <span>{error}</span>}</div>
        <div>
          {fields.map((field, index, fields) => {
            const component = fields.get(index);

            const externalEnvs = component.get("env").filter(x => {
              return x.get("type") === EnvTypeExternal;
            });

            const staticEnvs = component.get("env").filter(x => {
              return x.get("type") === EnvTypeStatic;
            });

            const missingExternalVariables = externalEnvs.filter(x => {
              return !isEnvInSharedEnv(x.get("name"));
            });

            const envLength = component.get("env").size;

            return (
              <div key={index}>
                <Grid container spacing={2}>
                  <Grid item md={12}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignContent="center"
                    >
                      <Typography variant="h5">
                        {component.get("name")}{" "}
                      </Typography>
                      <Box component="small" display="flex" alignItems="center">
                        Server / Cronjob
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item md={5}>
                    <Box>
                      <Typography>{component.get("image")}</Typography>
                    </Box>
                    <Box mt={3}>
                      <Box mr={1} display="inline">
                        <Chip
                          variant="outlined"
                          color="primary"
                          // icon={<FaceIcon />}
                          size="small"
                          label={`CPU  ${component.get("cpu") / 1000}Core`}
                        />
                      </Box>
                      <Box mr={1} display="inline">
                        <Chip
                          variant="outlined"
                          color="primary"
                          // icon={<FaceIcon />}
                          size="small"
                          label={`Memory ${component.get("memory") / 1000}G`}
                        />
                      </Box>
                      <Box mr={1} display="inline">
                        <Chip
                          variant="outlined"
                          color="default"
                          // icon={<FaceIcon />}
                          size="small"
                          label={`No disk`}
                        />
                      </Box>
                    </Box>
                    <Box mt={3} display="flex">
                      <Box>
                        <strong>TCP</strong> <strong>80</strong> ->{" "}
                        <strong>3000</strong>
                      </Box>
                      <Box ml={3}>web.__namespace__</Box>
                    </Box>
                    <Box mt={3}>
                      <EnvList
                        title="Linked environment variables"
                        envs={staticEnvs}
                      />
                      <EnvList
                        title="Static environment variables"
                        envs={staticEnvs}
                      />
                      <EnvList
                        defaultOpen={missingExternalVariables.size > 0}
                        title="External environment variables"
                        envs={externalEnvs}
                        missingEnvs={missingExternalVariables}
                        sharedEnvs={sharedEnv}
                      />
                    </Box>
                  </Grid>
                  <Grid item md={1}>
                    <Box display="flex" justifyContent="center" height="100%">
                      <Divider orientation="vertical" />
                    </Box>
                  </Grid>
                  <Grid item md={6}>
                    {[
                      {
                        title: "Monitoring"
                      },
                      {
                        title: "Manually Scale"
                      },
                      {
                        title: "External Access"
                      }
                    ].map(x => {
                      return (
                        <Box display="inline-block" mt={1} mr={1} key={x.title}>
                          <Chip
                            variant="outlined"
                            color="primary"
                            size="small"
                            label={x.title}
                            deleteIcon={<DeleteIcon />}
                          />
                        </Box>
                      );
                    })}
                    <Box mt={3}>
                      (Comment: I want to put plugins here, but still not figure
                      out how to deal with the UI. Leave things here for
                      scomments.)
                    </Box>
                  </Grid>
                </Grid>
                <Divider
                  style={{ marginTop: 24, marginBottom: 24 }}
                  variant="fullWidth"
                />
              </div>
            );
          })}
        </div>
        <Collapse
          in={isFormOpen}
          onExited={() => this.setState({ isAddButtonDisplayed: true })}
        >
          <div className={classes.inputForm}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Field component={RenderAutoCompleteSelect} label="Component">
                  {componentsIdAndNames.map(x => (
                    <MenuItem value={x.value} key={x.value}>
                      {x.text}
                    </MenuItem>
                  ))}
                </Field>
              </Grid>
              <Grid item xs={12}>
                {/* <CustomTextField label="Name" /> */}
              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      fullWidth
                      onClick={() => {
                        fields.push(componentsArray[0].set("name", "1231"));
                        this.setState({ isFormOpen: false });
                      }}
                    >
                      Save
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      color="primary"
                      onClick={() => {
                        this.setState({ isFormOpen: false });
                      }}
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        </Collapse>
        <Grow
          in={isAddButtonDisplayed}
          onExited={() => {
            this.setState({ isFormOpen: true });
          }}
        >
          <Button
            variant="outlined"
            size="small"
            color="primary"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => this.setState({ isAddButtonDisplayed: false })}
          >
            Add Component
          </Button>
        </Grow>
      </div>
    );
  }
}

const RenderComponentsWithStyles = withStyles(styles)(RenderComponents);

let components = (props: stateProps) => {
  return (
    <FieldArray
      name="components"
      component={RenderComponentsWithStyles}
      {...props}
    />
  );
};

export const Components = connect(mapStateToProps)(components);
