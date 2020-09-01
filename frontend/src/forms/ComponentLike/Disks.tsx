import { Box, Button, Grid, TextField } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import HelpIcon from "@material-ui/icons/Help";
import { Field, FieldArray, getIn, FieldArrayRenderProps } from "formik";
import { KTooltip } from "forms/Application/KTooltip";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import { getComponentFormVolumeOptions } from "selectors/component";
import {
  VolumeContent,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory,
} from "types/componentTemplate";
import { sizeStringToGi } from "utils/sizeConv";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Caption, H6 } from "widgets/Label";
import { RenderFormikSelectField } from "../Basic/select";
import { KRenderFormikTextField, RenderFormikComplexValueTextField } from "../Basic/textfield";
import { ValidatorRequired, ValidatorVolumeSize } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {
    volumeOptions: getComponentFormVolumeOptions(state),
    storageClasses: state.get("persistentVolumes").get("storageClasses"),
  };
};

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends FieldArrayRenderProps, FieldArrayProps {}

class RenderVolumesRaw extends React.PureComponent<Props> {
  private getUsingClaimNames() {
    const {
      form: { values },
      name,
    } = this.props;

    const claimNames: { [key: string]: boolean } = {};

    if (getIn(values, name)) {
      getIn(values, name).forEach((volume: VolumeContent, index: number) => {
        if (volume.type === VolumeTypePersistentVolumeClaim) {
          const claimName = volume.claimName;
          claimNames[claimName] = true;
        }
      });
    }

    return claimNames;
  }

  private getClaimNameOptions(disk: VolumeContent) {
    const { volumeOptions } = this.props;
    const usingClaimNames = this.getUsingClaimNames();
    const currentClaimName = disk.claimName;

    const options: {
      value: string;
      text: React.ReactNode;
      selectedText: string;
    }[] = [];

    volumeOptions.forEach((vo) => {
      if (vo.get("name") === currentClaimName || !usingClaimNames[vo.get("name")]) {
        options.push({
          value: vo.get("name"),
          text: (
            <Box pt={1} pb={1}>
              <H6>{vo.get("name")}</H6>
              <Box>
                {vo.get("componentNamespace") ? <Caption>Namespace: {vo.get("componentNamespace")}</Caption> : null}
              </Box>
              <Box>{vo.get("componentName") ? <Caption>Component: {vo.get("componentName")}</Caption> : null}</Box>
              <Box>
                <Caption>Storage Class: {vo.get("storageClassName")}</Caption>
              </Box>
              <Box>
                <Caption>size: {sizeStringToGi(vo.get("capacity")) + " Gi"}</Caption>
              </Box>
            </Box>
          ),
          selectedText: vo.get("name"),
        });
      }
    });

    return options;
  }

  private getStorageClassesOptions() {
    const { storageClasses } = this.props;

    const options: {
      value: string;
      text: string;
    }[] = [];

    storageClasses.forEach((sc) => {
      options.push({
        value: sc.get("name"),
        text: sc.get("name"),
      });
    });

    return options;
  }

  public getFieldComponents(disk: VolumeContent, index: number) {
    const { volumeOptions, name } = this.props;
    const volumeType = disk.type;
    const fieldComponents = [
      <Field
        name={`${name}.${index}.type`}
        component={RenderFormikSelectField}
        label="Type"
        validate={ValidatorRequired}
        placeholder="Select a volume type"
        defaultValue={VolumeTypePersistentVolumeClaimNew}
        options={[
          // { value: VolumeTypePersistentVolumeClaim, text: "Mount a disk" },
          { value: VolumeTypePersistentVolumeClaimNew, text: "Create and mount disk" },
          { value: VolumeTypePersistentVolumeClaim, text: "Mount an existing disk" },
          { value: VolumeTypeTemporaryDisk, text: "Mount a temporary disk" },
          { value: VolumeTypeTemporaryMemory, text: "Mount a temporary memory disk" },
        ]}
      />,
      <Field
        component={KRenderFormikTextField}
        name={`${name}.${index}.path`}
        label="Mount Path"
        validate={ValidatorRequired}
      />,
    ];

    if (volumeType === VolumeTypePersistentVolumeClaim) {
      const claimName = disk.claimName;
      const volumeOption = volumeOptions.find((vo) => vo.get("name") === claimName);

      fieldComponents.push(
        <Field
          name={`${name}.${index}.claimName`}
          component={RenderFormikSelectField}
          label="Claim Name"
          // validate={ValidatorRequired}
          placeholder="Select a Claim Name"
          options={this.getClaimNameOptions(disk)}
        />,
      );
      // only for show info
      fieldComponents.push(
        <TextField
          fullWidth
          disabled
          label="Storage Class"
          value={volumeOption?.get("storageClassName") || ""}
          margin="dense"
          variant="outlined"
        />,
      );
      // only for show info
      fieldComponents.push(
        <TextField
          fullWidth
          disabled
          label="Size"
          value={volumeOption?.get("capacity") ? sizeStringToGi(volumeOption?.get("capacity")) + " Gi" : ""}
          margin="dense"
          variant="outlined"
        />,
      );
    } else if (volumeType === VolumeTypePersistentVolumeClaimNew) {
      fieldComponents.push(
        <Field
          label="Storage Class"
          name={`${name}.${index}.storageClassName`}
          component={RenderFormikSelectField}
          placeholder="Select the type of your disk"
          options={this.getStorageClassesOptions()}
        />,
      );
      fieldComponents.push(
        <Field
          component={RenderFormikComplexValueTextField}
          name={`${name}.${index}.size`}
          label="Size"
          margin
          validate={ValidatorVolumeSize}
          endAdornment={this.getSizeEndAdornment()}
          // format={(value: any) => {
          //   return !value ? "" : sizeStringToGi(value);
          // }}
          // parse={(value: any) => {
          //   return !value ? "" : value + "Gi";
          // }}
        />,
      );
    } else {
      fieldComponents.push(
        <Field
          component={RenderFormikComplexValueTextField}
          name={`${name}.${index}.size`}
          label="Size"
          margin
          validate={ValidatorVolumeSize}
          endAdornment={this.getSizeEndAdornment()}
          // format={(value: any) => {
          //   return !value ? "" : sizeStringToGi(value);
          // }}
          // parse={(value: any) => {
          //   return !value ? "" : value + "Gi";
          // }}
        />,
      );
    }

    return fieldComponents;
  }

  private getSizeEndAdornment() {
    return (
      <KTooltip title={this.getSizeHelper()}>
        <Box display="flex" alignItems="center">
          <HelpIcon fontSize="small" style={{ cursor: "pointer", color: grey[700] }} />
          <Box ml={0.5}>Gi</Box>
        </Box>
      </KTooltip>
    );
  }

  private getSizeHelper() {
    return "Kalm uses Mi as the base unit of disk. 1 Gi equals 1024 Mi.";
  }

  public render() {
    const {
      name,
      push,
      remove,
      storageClasses,
      form: { values },
    } = this.props;

    return (
      <Box>
        <Box mb={2}>
          <Grid item xs>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => {
                push({
                  type: VolumeTypePersistentVolumeClaimNew,
                  path: "",
                  storageClassName: storageClasses.get(0)?.get("name") || "",
                  size: "",
                });
              }}
            >
              Add
            </Button>
            {/* {submitFailed && error && <span>{error}</span>} */}
          </Grid>
        </Box>

        {getIn(values, name) &&
          getIn(values, name).map((disk: VolumeContent, index: number) => {
            return (
              <Grid container spacing={2} key={index}>
                {this.getFieldComponents(disk, index).map((fieldComponent, fieldIndex) => {
                  return (
                    <Grid item xs={fieldIndex === 0 ? 3 : 2} key={`${name}-${fieldIndex}`}>
                      {fieldComponent}
                    </Grid>
                  );
                })}

                <Grid item xs={1}>
                  <IconButtonWithTooltip
                    tooltipPlacement="top"
                    tooltipTitle="Delete"
                    aria-label="delete"
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon />
                  </IconButtonWithTooltip>
                </Grid>
              </Grid>
            );
          })}
      </Box>
    );
  }
}

const RenderVolumes = connect(mapStateToProps)(RenderVolumesRaw);

export const Disks = connect(mapStateToProps)((props: any) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
});
