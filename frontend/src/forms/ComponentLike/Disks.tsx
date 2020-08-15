import { Box, Button, Grid, TextField } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import HelpIcon from "@material-ui/icons/Help";
import { KTooltip } from "forms/Application/KTooltip";
import Immutable from "immutable";
import React from "react";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import { arrayPush, WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { getComponentFormVolumeOptions } from "selectors/component";
import {
  Volume,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory,
} from "types/componentTemplate";
import { sizeStringToGi } from "utils/sizeConv";
import { AddIcon, DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { Caption, H6 } from "widgets/Label";
import { RenderSelectField } from "../Basic/select";
import { KRenderDebounceTextField, RenderComplexValueTextDebounceField } from "../Basic/textfield";
import { ValidatorRequired, ValidatorVolumeSize } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {
    volumeOptions: getComponentFormVolumeOptions(state),
    storageClasses: state.get("persistentVolumes").get("storageClasses"),
  };
};

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<Volume>, FieldArrayComponentHackType, FieldArrayProps {}

const sizeValidators = [ValidatorRequired, ValidatorVolumeSize];

class RenderVolumes extends React.PureComponent<Props> {
  private getUsingClaimNames() {
    const { fields } = this.props;

    const claimNames: { [key: string]: boolean } = {};

    fields.forEach((member, index) => {
      const volume = fields.get(index);
      if (volume.get("type") === VolumeTypePersistentVolumeClaim) {
        const claimName = volume.get("claimName");
        claimNames[claimName] = true;
      }
    });

    return claimNames;
  }

  private getClaimNameOptions(disk: Volume) {
    const { volumeOptions } = this.props;
    const usingClaimNames = this.getUsingClaimNames();
    const currentClaimName = disk.get("claimName");

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

  public getFieldComponents(member: string, disk: Volume) {
    const { volumeOptions } = this.props;
    const volumeType = disk.get("type");
    const fieldComponents = [
      <Field
        name={`${member}.type`}
        component={RenderSelectField}
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
        component={KRenderDebounceTextField}
        name={`${member}.path`}
        label="Mount Path"
        margin
        validate={ValidatorRequired}
      />,
    ];

    if (volumeType === VolumeTypePersistentVolumeClaim) {
      const claimName = disk.get("claimName");
      const volumeOption = volumeOptions.find((vo) => vo.get("name") === claimName);

      fieldComponents.push(
        <Field
          name={`${member}.claimName`}
          component={RenderSelectField}
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
          name={`${member}.storageClassName`}
          component={RenderSelectField}
          placeholder="Select the type of your disk"
          options={this.getStorageClassesOptions()}
        />,
      );
      fieldComponents.push(
        <Field
          component={RenderComplexValueTextDebounceField}
          name={`${member}.size`}
          label="Size"
          margin
          validate={sizeValidators}
          endAdornment={this.getSizeEndAdornment()}
          format={(value: any) => {
            return !value ? "" : sizeStringToGi(value);
          }}
          parse={(value: any) => {
            return !value ? "" : value + "Gi";
          }}
        />,
      );
    } else {
      fieldComponents.push(
        <Field
          component={RenderComplexValueTextDebounceField}
          name={`${member}.size`}
          label="Size"
          margin
          validate={sizeValidators}
          endAdornment={this.getSizeEndAdornment()}
          format={(value: any) => {
            return !value ? "" : sizeStringToGi(value);
          }}
          parse={(value: any) => {
            return !value ? "" : value + "Gi";
          }}
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
      fields,
      dispatch,
      storageClasses,
      meta: { submitFailed, error, form },
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
                dispatch(
                  arrayPush(
                    form,
                    fields.name,
                    Immutable.Map({
                      type: VolumeTypePersistentVolumeClaimNew,
                      path: "",
                      storageClassName: storageClasses.get(0)?.get("name") || "",
                      size: "",
                    }),
                  ),
                );
              }}
            >
              Add
            </Button>
            {submitFailed && error && <span>{error}</span>}
          </Grid>
        </Box>

        {fields.map((member, index) => {
          const disk = fields.get(index);
          return (
            <Grid container spacing={2} key={member}>
              {this.getFieldComponents(member, disk).map((fieldComponent, fieldIndex) => {
                return (
                  <Grid item xs={fieldIndex === 0 ? 3 : 2} key={`${member}-${fieldIndex}`}>
                    {fieldComponent}
                  </Grid>
                );
              })}

              <Grid item xs={1}>
                <IconButtonWithTooltip
                  tooltipPlacement="top"
                  tooltipTitle="Delete"
                  aria-label="delete"
                  onClick={() => fields.remove(index)}
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

export const Disks = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
});
