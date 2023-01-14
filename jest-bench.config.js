/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    ...require("./jest.config"),
    testEnvironment: "jest-bench/environment",
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/tsconfig.bench.json",
            },
        ],
    },
    testEnvironmentOptions: {
        // still Jest-bench environment will run your environment if you specify it here
        testEnvironment: "jest-environment-node"
    },
    // always include "default" reporter along with Jest-bench reporter
    // for error reporting
    reporters: ["default", "jest-bench/reporter"],
    // will pick up "*.bench.js" files or files in "__benchmarks__" folder.
    testRegex: "(/benchmark/.*|\\.bench)\\.(ts|tsx|js)$",
}
