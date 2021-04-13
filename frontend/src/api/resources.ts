import axios from "axios";

interface APIVersions {
  kind: "APIVersions";
  versions: string[];
}

interface APIGroupVersion {
  version: string;
  groupVersion: string;
}

interface APIGroup {
  name: string;
  preferredVersion: APIGroupVersion;
  versions: APIGroupVersion[];
}

interface APIGroupList {
  groups: APIGroup[];
}

interface APIResource {
  kind: string;
  name: string;
  namespaced: boolean;
  shortName: string[];
  singularName?: string;
  verbose: string[];
}

interface APIResourceList {
  kind: "APIResourceList";
  apiVersion: string;
  groupVersion: string;
  resources: APIResource[];
}

const loadApiResourcesRaw = async () => {
  const apiResources = await _loadApiResources();
  const apisResources = await _loadApisResources();
  const res = apiResources.concat(apisResources);
  window.localStorage.setItem("apiResources", JSON.stringify(res));
  return res;
};

export const loadApiResources = async () => {
  // if (window.localStorage.getItem("apiResources")) {
  //   loadApiResourcesRaw();
  //   return JSON.parse(window.localStorage.getItem("apiResources")!) as APIResourceList[];
  // }

  return await loadApiResourcesRaw();
};

const _loadApiResources = async (): Promise<APIResourceList[]> => {
  const res = await axios.get<APIVersions>("http://localhost:3001/proxy/api");
  const versions = res.data.versions;

  const promises: Promise<APIResourceList>[] = [];

  for (let version of versions) {
    promises.push(
      axios.get<APIResourceList>("http://localhost:3001/proxy/api/" + version).then((res) => {
        return res.data;
      }),
    );
  }

  return await Promise.all(promises);
};

const _loadApisResources = async (): Promise<APIResourceList[]> => {
  const res = await axios.get<APIGroupList>("http://localhost:3001/proxy/apis");
  const groups = res.data.groups;

  const promises: Promise<APIResourceList>[] = [];

  for (let group of groups) {
    for (let version of group.versions) {
      promises.push(
        axios.get<APIResourceList>("http://localhost:3001/proxy/apis/" + version.groupVersion).then((res) => {
          return res.data;
        }),
      );
    }
  }

  return Promise.all(promises);
};
