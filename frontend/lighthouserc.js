module.exports = {
  ci: {
    collect: {
      url: [
        "https://dashboard.kapp.live/",
        "https://dashboard.kapp.live/applications/lighthouse-ci/components",
        "https://dashboard.kapp.live/applications",
      ],
    },
    assert: {
      preset: "lighthouse:recommended",
    },
    upload: {
      target: "lhci",
      serverBaseUrl: "https://lc.kapp.live/",
    },
  },
};
