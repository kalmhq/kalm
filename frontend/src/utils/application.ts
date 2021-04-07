import produce from "immer";
import { getComponentFormVolumeOptions } from "selectors/component";
import { RootState } from "store";
import { ApplicationComponent, ApplicationComponentDetails } from "types/application";
import {
  ResourceRequirements,
  Volume,
  VolumeTypePersistentVolumeClaim,
  VolumeTypePersistentVolumeClaimNew,
  VolumeTypePersistentVolumeClaimTemplate,
  VolumeTypePersistentVolumeClaimTemplateNew,
  workloadTypeServer,
} from "types/componentTemplate";
import { formatAgeFromNow, formatDate } from "utils/date";
import { sizeStringToMi } from "./sizeConv";

export const componentDetailsToComponent = (componentDetails: ApplicationComponentDetails): ApplicationComponent => {
  const component = produce(componentDetails, (draft) => {
    if (!draft.workloadType) {
      draft.workloadType = workloadTypeServer;
    }
    delete draft.pods;
    delete draft.services;
    delete draft.metrics;
    delete draft.istioMetricHistories;
  });

  return component as ApplicationComponent;
};

export const correctComponentFormValuesForSubmit = (
  state: RootState,
  componentValues: ApplicationComponent,
): ApplicationComponent => {
  const volumes = componentValues.volumes;

  const volumeOptions = getComponentFormVolumeOptions(
    state,
    componentValues.name,
    componentValues.workloadType || workloadTypeServer,
  );

  const findPVC = (claimName: string) => {
    let pvc = "";
    let pvToMatch = "";
    let storageClassName = "";
    let size = "";

    volumeOptions.forEach((vo) => {
      if (vo.name === claimName) {
        pvc = vo.pvc;
        pvToMatch = vo.pvToMatch;
        storageClassName = vo.storageClassName;
        size = vo.capacity;
      }
    });

    return { pvc, pvToMatch, storageClassName, size };
  };

  const correctedVolumes = volumes?.map((v) => {
    const newVolume = produce(v, (draft) => {
      // set pvc and pvToMatch
      if (v.type === VolumeTypePersistentVolumeClaim || v.type === VolumeTypePersistentVolumeClaimTemplate) {
        const findResult = findPVC(v.claimName);
        draft.pvc = findResult.pvc;
        draft.pvToMatch = findResult.pvToMatch;
        draft.storageClassName = findResult.storageClassName;
        draft.size = findResult.size;
      }
      // if is pvc-new, set to pvc
      if (v.type === VolumeTypePersistentVolumeClaimNew) {
        draft.type = VolumeTypePersistentVolumeClaim;
      }
      if (v.type === VolumeTypePersistentVolumeClaimTemplateNew) {
        draft.type = VolumeTypePersistentVolumeClaimTemplate;
      }
    });
    return newVolume;
  });

  componentValues = produce(componentValues, (draft) => {
    draft.volumes = correctedVolumes;

    if (
      componentValues.cpuLimit ||
      componentValues.memoryLimit ||
      componentValues.cpuRequest ||
      componentValues.memoryRequest
    ) {
      const resourceRequirements: ResourceRequirements = {
        limits: {
          cpu: componentValues.cpuLimit,
          memory: componentValues.memoryLimit,
        },
        requests: {
          cpu: componentValues.cpuRequest,
          memory: componentValues.memoryRequest,
        },
      };
      draft.resourceRequirements = resourceRequirements;
    }

    if (componentValues.readinessProbe?.httpGet?.host === "localhost") {
      delete draft.readinessProbe?.httpGet?.host;
    }
    if (componentValues.livenessProbe?.httpGet?.host === "localhost") {
      delete draft.livenessProbe?.httpGet?.host;
    }
  });

  return componentValues;
};

export const correctComponentFormValuesForInit = (
  state: RootState,
  component: ApplicationComponent,
): ApplicationComponent => {
  let volumes = component.volumes;
  let correctedVolumes: Volume[];
  if (volumes) {
    const volumeOptions = getComponentFormVolumeOptions(
      state,
      component.name,
      component.workloadType || workloadTypeServer,
    );

    const findClaimName = (pvc?: string) => {
      pvc = pvc || "";
      let claimName = "";

      volumeOptions.forEach((vo) => {
        if (vo.pvc === pvc) {
          claimName = vo.name;
        }
      });

      return claimName;
    };

    correctedVolumes = volumes?.map((v) => {
      const newVolume = produce(v, (draft) => {
        // set claimName according to pvc
        if (v.type === VolumeTypePersistentVolumeClaim || v.type === VolumeTypePersistentVolumeClaimTemplate) {
          const claimName = findClaimName(v.pvc);
          draft.claimName = claimName;
        }
      });

      return newVolume;
    });
  }

  component = produce(component, (draft) => {
    if (volumes) {
      draft.volumes = correctedVolumes;
    }

    if (component.cpuLimit) {
      draft.cpuLimit = component.resourceRequirements?.limits?.cpu;
    }
    if (component.cpuRequest) {
      draft.cpuRequest = component.resourceRequirements?.requests?.cpu;
    }
    if (component.memoryLimit) {
      draft.memoryLimit = sizeStringToMi(component.memoryLimit) + "Mi";
    }
    if (component.memoryRequest) {
      draft.memoryRequest = sizeStringToMi(component.memoryRequest) + "Mi";
    }
  });

  return component;
};

export const getApplicationCreatedAtString = (components: ApplicationComponentDetails[]): string => {
  const createdAt = getApplicationCreatedAtDate(components);
  const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
  return createdAtString;
};

const getApplicationCreatedAtDate = (components: ApplicationComponentDetails[]): Date => {
  let createdAt = new Date(0);

  components.forEach((component) => {
    const componentCreatedAt = getComponentCreatedAtDate(component);
    if (createdAt <= new Date(0) || (componentCreatedAt > new Date(0) && componentCreatedAt < createdAt)) {
      createdAt = componentCreatedAt;
    }
  });

  return createdAt;
};

const getComponentCreatedAtString = (component: ApplicationComponentDetails): string => {
  const createdAt = getComponentCreatedAtDate(component);
  const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
  return createdAtString;
};

export const getComponentCreatedFromAndAtString = (component: ApplicationComponentDetails): string => {
  const createdAt = getComponentCreatedAtDate(component);
  const createdAtString =
    createdAt <= new Date(0) ? "-" : `${formatAgeFromNow(createdAt)} ago(${formatDate(createdAt)})`;
  return createdAtString;
};

const getComponentCreatedAtDate = (component: ApplicationComponentDetails): Date => {
  let createdAt = new Date(0);

  component.pods?.forEach((podStatus) => {
    const ts = podStatus.createTimestamp;
    const tsDate = new Date(ts);
    if (createdAt <= new Date(0) || (tsDate > new Date(0) && tsDate < createdAt)) {
      createdAt = tsDate;
    }
  });

  return createdAt;
};
