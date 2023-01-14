import { Deferred } from "benchmark";
import { benchmarkSuite } from "jest-bench";
import * as _t from "../tests/utils";
import createFileLogger, { FileLogger, WriteFile } from "../src";

let logger: FileLogger;

const files: WriteFile[] = [
    { day: "01", month: "01", year: "2023" },
    { day: "02", month: "02", year: "2023" },
    { day: "03", month: "03", year: "2023" },
];

benchmarkSuite("FileLogger:Write", {
        setupSuite() {
            logger = createFileLogger("bench");
        },

        teardownSuite() {
          // expect(logger.files.length).toEqual(3);
        },

        ["Generate Entries"]: () => {
            _t.genLogEntries(100000, logger, files);
        }
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    { timeoutSeconds: 1000, initCount: 1, minSamples: 1 }
)

let totalRead = 0;

benchmarkSuite("FileLogger:Read", {
    setupSuite() {
        logger = createFileLogger("bench");
    },

    teardownSuite() {
        expect(totalRead).toEqual(300000);
    },

    ["Read All Entries"]: (deferred: Deferred) => {
        _t.readEntries({}, logger)
            .then((total) => {
                totalRead = total;
                deferred.resolve()
            })
            .catch(() => {
                deferred.resolve();
            });
    }
}, 100000);
