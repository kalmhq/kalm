import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  Grow,
  MenuItem,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
import React from "react";
import { connect } from "react-redux";
import { Field, FieldArray, WrappedFieldArrayProps } from "redux-form";
import { ComponentFormValues } from "../../actions";
import { RootState } from "../../reducers";
import { CustomTextField, RenderAutoCompleteSelect } from "../Basic";
import { ValidatorRequired } from "../validator";
import { EnvList } from "./envList";

import DeleteIcon from "@material-ui/icons/Delete";

const mapStateToProps = (state: RootState) => {
  return {
    components: state.components
      .get("components")
      .toList()
      .toArray()
  };
};

type stateProps = ReturnType<typeof mapStateToProps>;

const RenderComponents = ({
  fields,
  meta: { error, submitFailed },
  components
}: WrappedFieldArrayProps<ComponentFormValues> & stateProps) => {
  const classes = makeStyles(theme => ({
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
  }))();

  const componentsIdAndNames = components.map(component => {
    return {
      value: component.id,
      text: component.name
    };
  });

  const [isFormOpen, setFormOpen] = React.useState(false);
  const [isAddButtonDisplayed, setAddButtonDisplay] = React.useState(true);

  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <div>
      <div>{submitFailed && error && <span>{error}</span>}</div>
      <div>
        {fields.map((field, index, fields) => {
          const component = fields.get(index);
          return (
            <div key={index}>
              <Grid container spacing={2}>
                <Grid item md={12}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignContent="center"
                  >
                    <Typography variant="h5">{component.name} </Typography>
                    <Box component="small" display="flex" alignItems="center">
                      Server / Cronjob
                    </Box>
                  </Box>
                </Grid>
                <Grid item md={5}>
                  <Box>
                    <Typography>{component.image}</Typography>
                  </Box>
                  <Box mt={3}>
                    <Box mr={1} display="inline">
                      <Chip
                        variant="outlined"
                        color="primary"
                        // icon={<FaceIcon />}
                        size="small"
                        label={`CPU  ${component.cpu / 1000}Core`}
                      />
                    </Box>
                    <Box mr={1} display="inline">
                      <Chip
                        variant="outlined"
                        color="primary"
                        // icon={<FaceIcon />}
                        size="small"
                        label={`Memory ${component.memory / 1000}G`}
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
                      title={
                        <>
                          Linked environment variables:
                          <Box color="primary.main" display="inline" ml={1}>
                            <strong>2</strong>
                          </Box>
                        </>
                      }
                      options={["AAA: 3"]}
                    />
                    <EnvList
                      title={
                        <>
                          Static environment variables:
                          <Box color="primary.main" display="inline" ml={1}>
                            <strong>12</strong>
                          </Box>
                        </>
                      }
                      options={["AAA: 3"]}
                    />
                    <EnvList
                      defaultOpen={true}
                      title={
                        <>
                          External environment variables
                          <Box color="secondary.main" display="inline" ml={1}>
                            <strong>22 / 24</strong>
                          </Box>
                        </>
                      }
                      options={[
                        <>
                          <Box mb={1}>
                            <Chip
                              label="DATABASE_URL"
                              color="secondary"
                              size="small"
                            ></Chip>{" "}
                            Needs to be defined in shared env.
                          </Box>
                          <Box mb={1}>
                            <Chip
                              label="ETHEREUM_URL"
                              color="secondary"
                              size="small"
                            ></Chip>{" "}
                            Needs to be defined in shared env.
                          </Box>
                        </>
                      ]}
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
                      <Box display="inline-block" mt={1} mr={1}>
                        <Chip
                          variant="outlined"
                          color="primary"
                          size="small"
                          label={x.title}
                          onClick={() => {}}
                          onDelete={() => {}}
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
      <Collapse in={isFormOpen} onExited={() => setAddButtonDisplay(true)}>
        <div className={classes.inputForm}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Field component={RenderAutoCompleteSelect} label="Component">
                {componentsIdAndNames.map(x => (
                  <MenuItem value={x.value}>{x.text}</MenuItem>
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
                      fields.push({ ...components[0], name: "1231" });
                      setFormOpen(false);
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
                      setFormOpen(false);
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
          setFormOpen(true);
        }}
      >
        <Button
          variant="outlined"
          size="small"
          color="primary"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() =>
            // fields.push({
            //   name: "",
            //   type: ""
            // })
            setAddButtonDisplay(false)
          }
        >
          Add Component
        </Button>
      </Grow>
    </div>
  );
};

interface Props {
  label?: string;
  helperText?: string;
  placeholder?: string;
}

let components = (props: stateProps) => {
  return (
    <div>
      <FieldArray
        {...props}
        name="components"
        //   valid={true}
        components={props.components}
        component={RenderComponents}
      />
    </div>
  );
};

// export const Components = connect((state: RootState) => {
//   const selector = formValueSelector("component");
//   const values = selector(state, "env");
//   return { values };
// })(components);

export const Components = connect(mapStateToProps)(components);
