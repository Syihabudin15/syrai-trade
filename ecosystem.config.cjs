module.exports = {
  apps: [
    {
      name: "syrai-trade",
      script: "./dist/src/index.js",
      env: {
        PORT: 5002,
        NODE_ENV: "production",
      },
    },
  ],
};
