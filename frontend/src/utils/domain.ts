import Immutable from "immutable";

export const forceHttpsDomainSuffixes = [".dev", ".app"];

export const includesForceHttpsDomain = (hosts: Immutable.List<string>): boolean => {
  let includes = false;

  hosts.forEach((host) => {
    forceHttpsDomainSuffixes.forEach((suffix) => {
      if (host.endsWith(suffix)) {
        includes = true;
      }
    });
  });

  return includes;
};
