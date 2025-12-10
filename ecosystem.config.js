module.exports = {
  apps: [
    {
      name: "kaptems",
      script: "npm",
      args: "run start",
      env: {
        PORT: 4003, // Set the port environment variable here
      },
    },
  ],
};
