import { Box, MenuItem } from "@material-ui/core";
import { createStyles, Theme, withStyles, WithStyles } from "@material-ui/core/styles";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form/immutable";
import { RootState } from "../../reducers";
import {
  Volume,
  VolumeTypeKappConfigs,
  VolumeTypePersistentVolumeClaimExisting,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory
} from "../../types/componentTemplate";
import { RenderSelectField } from "../Basic";
import { TextField } from "../Basic/text";
import { KappConfigPath } from "../ComponentLike/VolumeConfig";
import { ValidatorRequired } from "../validator";

interface OwnProps {}

const mapStateToProps = (state: RootState, ownProps: InjectedFormProps<Volume, OwnProps>) => {
  const selector = formValueSelector(ownProps.form);

  return {
    volumeType: selector(state, "type")
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
    }
  });

export interface Props
  extends InjectedFormProps<Volume, OwnProps>,
    ReturnType<typeof mapStateToProps>,
    WithStyles<typeof styles>,
    DispatchProp,
    OwnProps {}

class VolumeRaw extends React.PureComponent<Props> {
  private renderSelectType = () => {
    return (
      <Box mt={2}>
        <Field label="Volume type" name="type" component={RenderSelectField} placeholder="Select a volume type">
          <MenuItem value={VolumeTypePersistentVolumeClaimNew}>Create and mount disk</MenuItem>
          <MenuItem value={VolumeTypePersistentVolumeClaimExisting}>Mount an existing disk</MenuItem>
          <MenuItem value={VolumeTypeKappConfigs}>Mount configs</MenuItem>
          <MenuItem value={VolumeTypeTemporaryDisk}>Mount a temporary Disk</MenuItem>
          <MenuItem value={VolumeTypeTemporaryMemory}>Mount a temporary memory Disk</MenuItem>
        </Field>
      </Box>
    );
  };

  private renderRest = () => {
    const { volumeType } = this.props;
    if (volumeType === VolumeTypePersistentVolumeClaimNew) {
      return (
        <>
          <Box mt={2}>
            <Field label="New Disk Size" name="size" component={TextField} placeholder="1G" />
          </Box>
          {/* Options should comes from k8s api */}
          <Box mt={2}>
            <Field
              label="Storage Class"
              name="storageClassName"
              component={RenderSelectField}
              placeholder="Select the type of your disk">
              <MenuItem value={"standard"}>Storage Class 1</MenuItem>
              <MenuItem value={"standard"}>Storage Class 2</MenuItem>
              <MenuItem value={"standard"}>Storage Class 3</MenuItem>
            </Field>
          </Box>
        </>
      );
    } else if (volumeType === VolumeTypePersistentVolumeClaimExisting) {
      return (
        <Box mt={2}>
          <Field
            label="Persistent Volume Claim"
            name="persistentVolumeClaimName"
            component={RenderSelectField}
            placeholder="Select an existing PVC">
            <MenuItem value={"123"}>PVC 1</MenuItem>
            <MenuItem value={"123"}>PVC 2</MenuItem>
            <MenuItem value={"123"}>PVC 3</MenuItem>
          </Field>
        </Box>
      );
    } else if (volumeType === VolumeTypeKappConfigs) {
      return (
        <Box mt={2}>
          <KappConfigPath />
        </Box>
      );
    }
  };
  public render() {
    return (
      <div>
        {this.renderSelectType()}
        {this.renderRest()}
        <Box mt={2}>
          <Field
            name="path"
            component={TextField}
            label={"Mount Path"}
            placehoder="/var/tmp"
            validate={ValidatorRequired}
          />
        </Box>
      </div>
    );
  }
}

export const VolumeForm = reduxForm<Volume, OwnProps>({
  onSubmitFail: console.log
})(connect(mapStateToProps)(withStyles(styles)(VolumeRaw)));
