module.exports = {
  devServer: {
    port: 3000,
    host: 'localhost',
    client: {
      webSocketURL: {
        protocol: 'ws',
        hostname: 'localhost',
        port: 3000,
        pathname: '/ws',
      },
    },
  },
};