import "dotenv/config";

export default ({ config }) => {
    return {
        ...config,
        extra: {
            // @ts-ignore
            alchemyApiKey: process.env.ALCHEMY_API_KEY
        }
    };
};
