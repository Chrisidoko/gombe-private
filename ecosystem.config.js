module.exports = {
  apps: [
    {
      name: "higheredu",
      script: "npm",
      args: "run start",
      env: {
        PORT: 4004, // Set the port environment variable here
      },
    },
  ],
};
