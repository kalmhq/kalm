import { Box, Grid, TextField } from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import HelpIcon from "@material-ui/icons/Help";
import { diskSizeFormat, diskSizeParse, trimParse } from "forms/normalizer";
import { default as React } from "react";
import { Field } from "react-final-form";
import { FieldArray, FieldArrayRenderProps } from "react-final-form-arrays";
import { connect, DispatchProp } from "react-redux";
import { RootState } from "reducers";
import {
  Volume,
  VolumeTypeHostPath,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypePersistentVolumeClaimTemplate,
  VolumeTypePersistentVolumeClaimTemplateNew,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory,
  workloadTypeCronjob,
  workloadTypeDaemonSet,
  workloadTypeServer,
  workloadTypeStatefulSet,
} from "types/componentTemplate";
import { sizeStringToGi } from "utils/sizeConv";
import { default as sc, default as StringConstants } from "utils/stringConstants";
import { SkinnyAddButton } from "widgets/Button";
import { DeleteIcon } from "widgets/Icon";
import { IconButtonWithTooltip } from "widgets/IconButtonWithTooltip";
import { KTooltip } from "widgets/KTooltip";
import { Caption, H6, Subtitle1 } from "widgets/Label";
import { SectionTitle } from "widgets/SectionTitle";
import { HelperTextSection } from ".";
import { FinalSelectField } from "../Final/select";
import { FinalTextField } from "../Final/textfield";
import { ValidatorRequired, ValidatorVolumeSize } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {
    statefulSetOptions: state.persistentVolumes.statefulSetOptions,
    simpleOptions: state.persistentVolumes.simpleOptions,
    storageClasses: state.persistentVolumes.storageClasses,
  };
};

interface OwnProps {
  isEdit?: boolean;
  workloadType?: string;
  componentName?: string;
}

interface Props
  extends FieldArrayRenderProps<Volume, any>,
    DispatchProp,
    ReturnType<typeof mapStateToProps>,
    OwnProps {}

class RenderVolumesRaw extends React.PureComponent<Props> {
  private getUsingClaimNames() {
    const { fields } = this.props;

    const claimNames: { [key: string]: boolean } = {};

    if (fields.value) {
      fields.value.forEach((volume: Volume, index: number) => {
        if (volume.type === VolumeTypePersistentVolumeClaim) {
          const claimName = volume.claimName;
          claimNames[claimName] = true;
        }
      });
    }

    return claimNames;
  }

  private isEdit = () => {
    const { isEdit } = this.props;
    return isEdit;
  };

  private shouldDisabledStatefulSetPvcTemplate(fieldDiskType: string) {
    return this.isEdit() && fieldDiskType === VolumeTypePersistentVolumeClaimTemplate;
  }

  private getVolumeOptions = () => {
    const { workloadType, componentName, statefulSetOptions, simpleOptions } = this.props;
    return workloadType === workloadTypeStatefulSet
      ? statefulSetOptions.filter((statefulSetOption) => statefulSetOption.componentName === componentName)
      : simpleOptions;
  };

  private getClaimNameOptions(disk: Volume) {
    const volumeOptions = this.getVolumeOptions();
    const usingClaimNames = this.getUsingClaimNames();
    const currentClaimName = disk.claimName;

    const options: {
      value: string;
      text: React.ReactNode;
      selectedText: string;
    }[] = [];

    volumeOptions.forEach((vo) => {
      if (vo.name === currentClaimName || !usingClaimNames[vo.name]) {
        options.push({
          value: vo.name,
          text: (
            <Box pt={1} pb={1}>
              <H6>{vo.name}</H6>
              <Box>{vo.componentNamespace ? <Caption>Namespace: {vo.componentNamespace}</Caption> : null}</Box>
              <Box>{vo.componentName ? <Caption>Component: {vo.componentName}</Caption> : null}</Box>
              <Box>
                <Caption>Storage Class: {vo.storageClassName}</Caption>
              </Box>
              <Box>
                <Caption>size: {sizeStringToGi(vo.capacity) + " Gi"}</Caption>
              </Box>
            </Box>
          ),
          selectedText: vo.name,
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
        value: sc.name,
        text: sc.name,
      });
    });

    return options;
  }

  private getTypeOptions(filedDiskType: string) {
    let options: { value: string; text: string }[] = [];
    const { workloadType } = this.props;
    if (workloadType === workloadTypeServer) {
      options = [
        { value: VolumeTypePersistentVolumeClaimNew, text: "Create and mount disk" },
        { value: VolumeTypePersistentVolumeClaim, text: "Mount an existing disk" },
      ];
    } else if (workloadType === workloadTypeCronjob) {
      options = [];
    } else if (workloadType === workloadTypeDaemonSet) {
      options = [{ value: VolumeTypeHostPath, text: "Mount a hostPath disk" }];
    } else if (workloadType === workloadTypeStatefulSet) {
      if (this.isEdit()) {
        if (this.shouldDisabledStatefulSetPvcTemplate(filedDiskType)) {
          options = [{ value: VolumeTypePersistentVolumeClaimTemplate, text: "Mount an existing disk group" }];
        }
      } else {
        options = [
          { value: VolumeTypePersistentVolumeClaimTemplateNew, text: "Create and mount disk group" },
          { value: VolumeTypePersistentVolumeClaimTemplate, text: "Mount an existing disk group" },
        ];
      }
    }

    options.push({ value: VolumeTypeTemporaryDisk, text: "Mount a temporary disk" });
    options.push({ value: VolumeTypeTemporaryMemory, text: "Mount a temporary memory disk" });

    return options;
  }

  private getDefaultAddValues(): any {
    const { storageClasses, workloadType } = this.props;

    if (workloadType === workloadTypeServer) {
      return {
        type: VolumeTypePersistentVolumeClaimNew,
        path: "",
        storageClassName: storageClasses[0]?.name || "",
        size: "",
      };
    } else if (workloadType === workloadTypeCronjob) {
      return {
        type: VolumeTypeTemporaryDisk,
        path: "",
        size: "",
      };
    } else if (workloadType === workloadTypeDaemonSet) {
      return {
        type: VolumeTypeHostPath,
        path: "",
        hostPath: "",
      };
    } else if (workloadType === workloadTypeStatefulSet) {
      if (this.isEdit()) {
        return {
          type: VolumeTypeTemporaryDisk,
          path: "",
          size: "",
        };
      }
      return {
        type: VolumeTypePersistentVolumeClaimTemplateNew,
        path: "",
        storageClassName: storageClasses[0]?.name || "",
        size: "",
      };
    }

    return {
      type: VolumeTypePersistentVolumeClaimNew,
      path: "",
      storageClassName: storageClasses[0]?.name || "",
      size: "",
    };
  }

  public getFieldComponents(disk: Volume, index: number) {
    const { fields } = this.props;
    const name = fields.name;
    const volumeOptions = this.getVolumeOptions();
    const typeOptions = this.getTypeOptions(disk.type);
    const shouldDisabledStatefulSetPvcTemplate = this.shouldDisabledStatefulSetPvcTemplate(disk.type);

    const fieldComponents = [
      <Field
        name={`${name}.${index}.type`}
        component={FinalSelectField}
        label="Type"
        value={disk.type || typeOptions[0].value}
        options={typeOptions}
        disabled={shouldDisabledStatefulSetPvcTemplate}
      />,
      <Field
        component={FinalTextField}
        name={`${name}.${index}.path`}
        label="Mount Path"
        validate={ValidatorRequired}
        parse={trimParse}
        placeholder={StringConstants.MOUNT_PATH_PLACEHOLDER}
      />,
    ];

    if (disk.type === VolumeTypePersistentVolumeClaim || disk.type === VolumeTypePersistentVolumeClaimTemplate) {
      const claimName = disk.claimName;
      const volumeOption = volumeOptions.find((vo) => vo.name === claimName);

      fieldComponents.push(
        <Field
          name={`${name}.${index}.claimName`}
          component={FinalSelectField}
          label="Claim Name"
          options={this.getClaimNameOptions(disk)}
          disabled={shouldDisabledStatefulSetPvcTemplate}
        />,
      );
      // only for show info
      fieldComponents.push(
        <TextField
          fullWidth
          disabled
          label="Storage Class"
          value={volumeOption?.storageClassName || ""}
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
          value={volumeOption?.capacity ? sizeStringToGi(volumeOption?.capacity) + " Gi" : ""}
          margin="dense"
          variant="outlined"
        />,
      );
    } else if (
      disk.type === VolumeTypePersistentVolumeClaimNew ||
      disk.type === VolumeTypePersistentVolumeClaimTemplateNew
    ) {
      fieldComponents.push(
        <Field
          label="Storage Class"
          name={`${name}.${index}.storageClassName`}
          component={FinalSelectField}
          placeholder="Select the type of your disk"
          options={this.getStorageClassesOptions()}
        />,
      );
      fieldComponents.push(
        <Field
          component={FinalTextField}
          name={`${name}.${index}.size`}
          label="Size"
          margin
          validate={ValidatorVolumeSize}
          endAdornment={this.getSizeEndAdornment()}
          format={diskSizeFormat}
          parse={diskSizeParse}
        />,
      );
    } else if (disk.type === VolumeTypeHostPath) {
      fieldComponents.push(
        <Field
          component={FinalTextField}
          name={`${name}.${index}.hostPath`}
          label="Host Path"
          validate={ValidatorRequired}
          parse={trimParse}
        />,
      );
    } else {
      fieldComponents.push(
        <Field
          component={FinalTextField}
          name={`${name}.${index}.size`}
          label="Size"
          margin
          validate={ValidatorVolumeSize}
          endAdornment={this.getSizeEndAdornment()}
          format={diskSizeFormat}
          parse={diskSizeParse}
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

  private handleRemove(index: number) {
    this.props.fields.remove(index);
  }

  private handlePush() {
    this.props.fields.push(this.getDefaultAddValues());
  }

  public render() {
    const { fields } = this.props;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SectionTitle>
            <Subtitle1>Disks</Subtitle1>
            <Box mb={2} mt={2} ml={2}>
              <SkinnyAddButton onClick={this.handlePush.bind(this)}>Add</SkinnyAddButton>
            </Box>
          </SectionTitle>
        </Grid>
        <HelperTextSection>{sc.DISKS_HELPER}</HelperTextSection>
        <Grid item xs={12}>
          <Box>
            <Box mb={2}>
              <Grid item xs>
                {/* {submitFailed && error && <span>{error}</span>} */}
              </Grid>
            </Box>
            {fields.value &&
              fields.value.map((disk: Volume, index: number) => {
                return (
                  <Grid container spacing={2} key={index}>
                    {this.getFieldComponents(disk, index).map((fieldComponent, fieldIndex) => {
                      return (
                        <Grid item xs={fieldIndex === 0 ? 3 : 2} key={`${fields.name}-${fieldIndex}`}>
                          {fieldComponent}
                        </Grid>
                      );
                    })}

                    <Grid item xs={1}>
                      <IconButtonWithTooltip
                        tooltipPlacement="top"
                        tooltipTitle="Delete"
                        aria-label="delete"
                        disabled={this.shouldDisabledStatefulSetPvcTemplate(disk.type)}
                        onClick={this.handleRemove.bind(this, index)}
                      >
                        <DeleteIcon />
                      </IconButtonWithTooltip>
                    </Grid>
                  </Grid>
                );
              })}
          </Box>
        </Grid>
      </Grid>
    );
  }
}

const RenderVolumes = connect(mapStateToProps)(RenderVolumesRaw);

export const Disks = (props: OwnProps) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
};
