module.exports = (api) => {
  const isServer = api.cache(() => process.env.APP_ENV === "server");

  const presets = [
    [
      "@babel/preset-env",
      {
        targets: isServer ? { node: "current" } : { chrome: "58" },
      },
    ],
  ];

  const plugins = [];

  if (isServer) {
    plugins.push([
      require.resolve("babel-plugin-module-resolver"),
      {
        root: ["."],
        alias: {
          "@/models": "./src/server/models",
          "@/config": "./config",
          "@/processing": "./src/server/processing",
          "@/middleware": "./src/server/middleware",
          "@/utils": "./src/server/utils",
        },
      },
    ]);
  } else {
    presets.push(["@vue/babel-preset-jsx"]);
  }

  return {
    presets,
    plugins,
  };
};
