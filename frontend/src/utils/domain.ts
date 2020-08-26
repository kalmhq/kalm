// https://source.chromium.org/chromium/chromium/src/+/master:net/http/transport_security_state_static.json
export const forceHttpsDomainSuffixes = [
  "android",
  "app",
  "bank",
  "chrome",
  "dev",
  "foo",
  "gle",
  "gmail",
  "google",
  "hangout",
  "insurance",
  "meet",
  "new",
  "page",
  "play",
  "search",
  "youtube",
  // Domains on the public suffix list that have requested to be preloaded.
  "bmoattachments.org",
  "now.sh",
  "cnpy.gdn",
  "gentapps.com",
];

export const includesForceHttpsDomain = (hosts: string[]): string[] => {
  const includedSuffixes: string[] = [];

  forceHttpsDomainSuffixes.forEach((suffix) => {
    let includesThisSuffix = false;

    hosts.forEach((host) => {
      if (host.endsWith(suffix)) {
        includesThisSuffix = true;
      }
    });

    if (includesThisSuffix) {
      includedSuffixes.push(suffix);
    }
  });

  return includedSuffixes;
};
