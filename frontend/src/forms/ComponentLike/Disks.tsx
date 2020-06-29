import React from "react";
import { connect, DispatchProp } from "react-redux";
import { WrappedFieldArrayProps } from "redux-form";
import { Field, FieldArray } from "redux-form/immutable";
import { RootState } from "../../reducers";
import { getComponentVolumeType, isDirtyField } from "../../selectors/component";
import {
  Volume,
  VolumeTypePersistentVolumeClaim,
  VolumeTypeTemporaryDisk,
  VolumeTypeTemporaryMemory
} from "../../types/componentTemplate";
import { FieldArrayWrapper } from "../Basic/FieldArrayWrapper";
import { RenderSelectField } from "../Basic/select";
import { KRenderTextField } from "../Basic/textfield";
import { ValidatorRequired, ValidatorVolumeSize } from "../validator";

const mapStateToProps = (state: RootState) => {
  return {
    storageClasses: state.get("persistentVolumes").get("storageClasses"),
    persistentVolumes: state.get("persistentVolumes").get("persistentVolumes"),
  };
};

interface FieldArrayComponentHackType {
  name: any;
  component: any;
}

interface FieldArrayProps extends DispatchProp, ReturnType<typeof mapStateToProps> {}

interface Props extends WrappedFieldArrayProps<Volume>, FieldArrayComponentHackType, FieldArrayProps {}

class RenderVolumes extends React.PureComponent<Props> {
  private getClaimNameOptions() {
    const { persistentVolumes } = this.props;

    const options: {
      value: string;
      text: string;
    }[] = [];

    options.push({
      value: "",
      text: "Create a new disk",
    });

    persistentVolumes.forEach((pv) => {
      options.push({
        value: pv.get("name"),
        text: pv.get("name"),
      });
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

  public getFieldComponents(member: string) {
    const volumeType = getComponentVolumeType(member);
    // console.log("volumeType", volumeType);
    // console.log("isDirtyField", member, isDirtyField(member + "type"));

    const isOld = volumeType !== undefined && !isDirtyField(member + "type");

    const fieldComponents = [
      <Field
        disabled={isOld}
        name={`${member}.type`}
        component={RenderSelectField}
        label="Type"
        validate={[ValidatorRequired]}
        placeholder="Select a volume type"
        options={[
          { value: VolumeTypePersistentVolumeClaim, text: "Mount a disk" },
          // { value: VolumeTypePersistentVolumeClaimNew, text: "Create and mount disk" },
          // { value: VolumeTypePersistentVolumeClaimExisting, text: "Mount an existing disk" },
          { value: VolumeTypeTemporaryDisk, text: "Mount a temporary disk" },
          { value: VolumeTypeTemporaryMemory, text: "Mount a temporary memory disk" },
        ]}
      ></Field>,
    ];

    if (volumeType === VolumeTypePersistentVolumeClaim) {
      fieldComponents.push(
        <Field
          disabled={isOld}
          name={`${member}.persistentVolumeClaimName`}
          component={RenderSelectField}
          label="Claim Name"
          // validate={[ValidatorRequired]}
          placeholder="Select a Claim Name"
          options={this.getClaimNameOptions()}
        ></Field>,
      );
      fieldComponents.push(
        <Field
          disabled={isOld}
          label="Storage Class"
          name={`${member}.storageClassName`}
          component={RenderSelectField}
          placeholder="Select the type of your disk"
          options={this.getStorageClassesOptions()}
        ></Field>,
      );
    }

    fieldComponents.push(
      <Field
        disabled={isOld}
        component={KRenderTextField}
        name={`${member}.path`}
        label="Mount Path"
        margin
        validate={[ValidatorRequired]}
      />,
    );
    fieldComponents.push(
      <Field
        disabled={isOld}
        component={KRenderTextField}
        name={`${member}.size`}
        label="Size"
        margin
        validate={[ValidatorRequired, ValidatorVolumeSize]}
      />,
    );

    return fieldComponents;
  }

  public render() {
    return (
      <FieldArrayWrapper
        getFieldComponents={(member: string) => this.getFieldComponents(member)}
        // onAdd={() => this.props.fields.push(Immutable.Map({}))}
        {...this.props}
      />
    );
  }
}

export const Disks = connect(mapStateToProps)((props: FieldArrayProps) => {
  return <FieldArray name="volumes" component={RenderVolumes} {...props} />;
});
