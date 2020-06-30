import { ApplicationComponentDetails, ApplicationComponent, ApplicationDetails } from "types/application";
import { formatDate } from "utils";
import { getComponentFormVolumeOptions } from "selectors/component";
import { VolumeTypePersistentVolumeClaim, VolumeTypePersistentVolumeClaimNew } from "types/componentTemplate";

export const componentDetailsToComponent = (componentDetails: ApplicationComponentDetails): ApplicationComponent => {
  return componentDetails.delete("pods").delete("services").delete("metrics") as ApplicationComponent;
};

export const correctComponentFormValuesForSubmit = (componentValues: ApplicationComponent): ApplicationComponent => {
  const volumes = componentValues.get("volumes");

  const volumeOptions = getComponentFormVolumeOptions(componentValues.get("name"), componentValues.get("workloadType"));

  const findPVC = (claimName: string) => {
    let pvc = "";
    let pvToMatch = "";

    volumeOptions.forEach((vo) => {
      if (vo.get("name") === claimName) {
        pvc = vo.get("pvc");
        pvToMatch = vo.get("pvToMatch");
      }
    });

    return { pvc, pvToMatch };
  };

  const correctedVolumes = volumes?.map((v) => {
    // set pvc and pvToMatch
    if (v.get("type") === VolumeTypePersistentVolumeClaim) {
      const findResult = findPVC(v.get("claimName"));
      v = v.set("pvc", findResult.pvc);
      v = v.set("pvToMatch", findResult.pvToMatch);
    }
    // if is pvc-new, set to pvc
    if (v.get("type") === VolumeTypePersistentVolumeClaimNew) {
      v = v.set("type", VolumeTypePersistentVolumeClaim);
    }
    return v;
  });

  return componentValues.set("volumes", correctedVolumes);
};

export const correctComponentFormValuesForInit = (component: ApplicationComponent): ApplicationComponent => {
  let volumes = component.get("volumes");
  if (volumes) {
    const volumeOptions = getComponentFormVolumeOptions(component.get("name"), component.get("workloadType"));

    const findClaimName = (pvc?: string, pvToMatch?: string) => {
      pvc = pvc || "";
      pvToMatch = pvToMatch || "";
      let claimName = "";

      volumeOptions.forEach((vo) => {
        if (vo.get("pvc") === pvc && vo.get("pvToMatch") === pvToMatch) {
          claimName = vo.get("name");
        }
      });

      return claimName;
    };

    const correctedVolumes = volumes?.map((v) => {
      // set pvc and pvToMatch
      if (v.get("type") === VolumeTypePersistentVolumeClaim) {
        const claimName = findClaimName(v.get("pvc"), v.get("pvToMatch"));
        v = v.set("claimName", claimName);
      }

      return v;
    });

    component = component.set("volumes", correctedVolumes);
  }

  return component;
};

export const getApplicationCreatedAtString = (application: ApplicationDetails): string => {
  const createdAt = getApplicationCreatedAtDate(application);
  const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
  return createdAtString;
};

export const getApplicationCreatedAtDate = (application: ApplicationDetails): Date => {
  let createdAt = new Date(0);

  application.get("components")?.forEach((component) => {
    const componentCreatedAt = getComponentCreatedAtDate(component);
    if (createdAt <= new Date(0) || (componentCreatedAt > new Date(0) && componentCreatedAt < createdAt)) {
      createdAt = componentCreatedAt;
    }
  });

  return createdAt;
};

export const getComponentCreatedAtString = (component: ApplicationComponentDetails): string => {
  const createdAt = getComponentCreatedAtDate(component);
  const createdAtString = createdAt <= new Date(0) ? "-" : formatDate(createdAt);
  return createdAtString;
};

export const getComponentCreatedAtDate = (component: ApplicationComponentDetails): Date => {
  let createdAt = new Date(0);

  component.get("pods").forEach((podStatus) => {
    const ts = podStatus.get("createTimestamp");
    const tsDate = new Date(ts);
    if (createdAt <= new Date(0) || (tsDate > new Date(0) && tsDate < createdAt)) {
      createdAt = tsDate;
    }
  });

  return createdAt;
};
