module.exports = {
  apps: [
    {
      name: "higheredu",
      script: "./node_modules/next/dist/bin/next", // Runs Next.js directly instead of npm
      args: "start",
      instances: "max", // Spawns a process for every CPU core
      exec_mode: "cluster", // Enables cluster mode for zero-downtime
      env: {
        PORT: 4004,
      },
    },
  ],
};
