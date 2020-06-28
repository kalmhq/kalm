import { pki } from "node-forge";
import Immutable from "immutable";

export const getDisplayName = (WrappedComponent: React.ComponentType) => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const extractDomainsFromCertificateContent = (certificateContent: string) => {
  try {
    const cert = pki.certificateFromPem(certificateContent);
    return Immutable.List(
      cert.subject.attributes.map((attribute) => {
        return attribute.value;
      }),
    );
  } catch (e) {
    console.log(e);
    return Immutable.List([]);
  }
};

export const maxIn = (...args: number[]) => {
  if (args.length === 0) {
    return 0;
  }

  let max = args[0];

  for (let i = 0; i < args.length; i++) {
    if (args[i] > max) {
      max = args[i];
    }
  }

  return max;
};
