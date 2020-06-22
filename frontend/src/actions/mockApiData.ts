export const certificateListData = {
  data: [
    {
      name: "cert",
      isSelfManaged: false,
      httpsCertIssuer: "ca2",
      domains: ["dd.lo", "ec.op"],
      ready: "False",
      reason: 'Waiting for CertificateRequest "cert-3429837659" to complete'
    },
    { name: "dadada", isSelfManaged: true, domains: ["hydro.io"], ready: "True", reason: "" },
    {
      name: "dd",
      isSelfManaged: false,
      httpsCertIssuer: "cloudflare",
      domains: ["ss.ff"],
      ready: "False",
      reason: 'Waiting for CertificateRequest "dd-2325188776" to complete'
    },
    {
      name: "default-https-cert",
      isSelfManaged: false,
      httpsCertIssuer: "default-cert-issuer",
      domains: ["*"],
      ready: "True",
      reason: "Certificate is up to date and has not expired"
    },
    { name: "hydro3", isSelfManaged: true, domains: ["hyo.io"], ready: "True", reason: "" },
    {
      name: "kalata",
      isSelfManaged: false,
      httpsCertIssuer: "ca",
      domains: ["dde.ll"],
      ready: "False",
      reason: 'Waiting for CertificateRequest "kalata-1118927936" to complete'
    },
    { name: "tte", isSelfManaged: true, domains: ["hydro.io"], ready: "True", reason: "" }
  ]
};
