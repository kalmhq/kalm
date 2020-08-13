module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/applications/kalm-bookinfo/components",
        "http://localhost:3000/applications",
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
