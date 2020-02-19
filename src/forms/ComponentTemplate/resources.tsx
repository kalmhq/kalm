import {
  createStyles,
  Grid,
  Theme,
  withStyles,
  WithStyles
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { CustomTextField } from "../Basic";
import { CustomDisks } from "../Basic/disk";
import { NormalizeCPU, NormalizeMemory } from "../normalizer";
import { ValidatorCPU, ValidatorRequired, ValidatorMemory } from "../validator";

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

interface ComponentResourcesProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(
  class ComponentResources extends React.PureComponent<
    ComponentResourcesProps
  > {
    public render() {
      return (
        <Grid container md={12} spacing={2}>
          <Grid item md={6}>
            <CustomTextField
              // className={classes.input}
              name="cpu"
              label="CPU"
              margin
              validate={[ValidatorCPU]}
              normalize={NormalizeCPU}
              placeholder="Please type the component name"
            />
          </Grid>
          <Grid item md={6}>
            <CustomTextField
              // className={classes.input}
              name="memory"
              label="Memory"
              margin
              validate={[ValidatorMemory]}
              normalize={NormalizeMemory}
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
);
