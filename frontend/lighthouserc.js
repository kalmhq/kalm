module.exports = {
  ci: {
    collect: {
      url: [
        "https://dashboard.kapp.live/",
        "https://dashboard.kapp.live/applications/lighthouse-ci/components",
        "https://dashboard.kapp.live/applications",
      ],
      //   startServerCommand: "npm run start",
      //   startServerReadyPattern: "ready on",
      //   settings: {
      //     extraHeaders: JSON.stringify({
      //       authorization:
      //         "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ik1xRGVHdnNYNFExeGJIVEhNUEtLc2czUUp1NWFLaWdlLXpyOVNzVVN5eWsifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImthcHAtc2FtcGxlLXVzZXItdG9rZW4ta3J4cDYiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoia2FwcC1zYW1wbGUtdXNlciIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6ImNiNGQwYjdlLWFhNjctNDUyZi1hZjQ3LTY5MzRjZjFlZDQ4YSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmthcHAtc2FtcGxlLXVzZXIifQ.t49nxiVKEBb8Wch8NB6MI4EXNDb6guGVQtwKdqjkJp0FeSSI_eKMTuBySoiVljH9F7NgBDPtYPnhxlK0xc13YqtzZKOyaoYjsARDGuiFCWLpq1CDRj0tFJPGJQ83GQm5VNHlR2bhv7mpv2m_7gHlIIEGnCY4CHDJZcpw4Ity1NP_SsYqjvu4uJ08JqdEzMdYcEKR4z7JC1aH5XSWyFp7so_p7elHDXJsg3FGiKjlxYDOFiE181g5eJODXlB4Bf460AHceYtECOlm9L8lFSf_RKrxKq-PGShQhz30DcccXDsScSR2rx7jWUuM7UFqm0WrBag3fzmWeClvWyX38tJy9g",
      //     }),
      //   },
    },
    assert: {
      preset: "lighthouse:recommended",
    },
    upload: {
      target: "lhci",
      serverBaseUrl: "https://lc.kapp.live/",
      token: "82a3c130-6818-4e8b-884a-66492b271646",
    },
    // server: {
    //   // server options here
    // },
  },
};
