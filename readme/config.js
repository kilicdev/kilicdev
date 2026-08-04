const path = require("node:path");

module.exports = {
    username: process.env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || "kilicdev",
    outputFile: path.resolve(__dirname, "../public/libs/readme-stats.svg"),
    dataFile: path.resolve(__dirname, "../public/libs/profile-data.json"),
    repositoryLimit: 5,
    organizationLimit: 5,
    commitLimit: 5,
};
