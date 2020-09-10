import { pki } from "node-forge";

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
    // 1. wildcard multiple domains
    // 2. alt name multiple domains
    // https://medium.com/@pubudu538/how-to-create-a-self-signed-ssl-certificate-for-multiple-domains-25284c91142b
    // https://www.rpkamp.com/2014/08/25/setting-up-a-multi-domain-self-signed-ssl-certificate/
    const cert = pki.certificateFromPem(certificateContent);

    let domains = new Array<string>();

    // multiple domains
    if (cert.extensions.length > 0) {
      cert.extensions.map((attribute) => {
        if (attribute.altNames && attribute.altNames.length > 0) {
          attribute.altNames.map((altName: any) => {
            domains.push(altName.value);
            return altName;
          });
        }
        return attribute;
      });
    }

    // signle domain
    cert.subject.attributes.map((attribute) => {
      if (attribute.name === "commonName") {
        domains.push(attribute.value);
      }
      return attribute;
    });
    return domains;
  } catch (e) {
    console.log(e);
    return [];
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
