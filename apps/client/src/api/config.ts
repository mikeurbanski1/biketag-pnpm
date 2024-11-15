export const config = {
    protocol: 'http',
    host: 'localhost',
    port: 3001
};

export const getUrl = () => {
    return `${config.protocol}://${config.host}:${config.port}`;
};
