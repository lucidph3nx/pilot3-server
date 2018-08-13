module.exports = {
    "extends": "google",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 8,
        "ecmaFeatures": {
            "jsx": true,
            "experimentalObjectRestSpread": true
        }
    },
    "rules": {
        // windows linebreaks when not in production environment
        "linebreak-style": ["error", process.env.NODE_ENV === 'prod' ? "unix" : "windows"],
        "max-len": ["error", { "code": 120 }]
    }
};
