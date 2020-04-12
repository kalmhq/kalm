import { createStyles, Grid, Theme, withStyles, WithStyles } from "@material-ui/core";
import React from "react";
import { CustomTextField } from "../Basic";
import { ValidatorCPU, ValidatorMemory } from "../validator";
import { DispatchProp } from "react-redux";
import { change } from "redux-form";

const styles = (_: Theme) =>
  createStyles({
    header: {
      marginBottom: 50
    },
    diskHeader: {
      marginTop: 20,
      marginBottom: 20
    }
  });

interface ComponentResourcesProps extends WithStyles<typeof styles>, DispatchProp {
  cpu: string | null;
  memory: string | null;
  formName: string;
}

class ComponentResourcesRaw extends React.PureComponent<ComponentResourcesProps> {
  componentDidUpdate() {
    const { cpu, memory, dispatch, formName } = this.props;
    if (!cpu) {
      dispatch(change(formName, "cpu", null));
    }

    if (!memory) {
      dispatch(change(formName, "memory", null));
    }
  }

  public render() {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={6}>
          <CustomTextField
            // className={classes.input}
            name="cpu"
            label="CPU"
            margin
            validate={[ValidatorCPU]}
            // normalize={NormalizeCPU}
            placeholder="Please type the component name"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <CustomTextField
            // className={classes.input}
            name="memory"
            label="Memory"
            margin
            validate={[ValidatorMemory]}
            // normalize={NormalizeMemory}
            placeholder="Please type the component name"
          />
        </Grid>
        {/* <Typography
            variant="h5"
            gutterBottom
            classes={{ root: this.props.classes.diskHeader }}
          >
            Disk
          </Typography>
          <CustomDisks /> */}
      </Grid>
    );
  }
}

export const ComponentResources = withStyles(styles)(ComponentResourcesRaw);
