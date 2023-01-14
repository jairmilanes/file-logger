import {writeFileSync} from "fs";
import createFileLogger, {FileLogger, LogEntry, LogLevelName, ReadOptions, WriteFile} from "../src";
import * as _t from "./utils";
import * as _ from "../src/_";
import {join} from "path";

jest.setTimeout(10000);

describe("FileLogger", () => {
    let logger: FileLogger;

    it("should create new FileLogger class", () => {
        const logger = createFileLogger("my-app", {level: _.logLevelByName.INFO});
        expect(logger).toBeInstanceOf(FileLogger);
    })

    it("should expose helper methods", () => {
        const logger = createFileLogger("my-app", {level: _.logLevelByName.INFO});
        expect(typeof logger.error).toEqual("function");
        expect(typeof logger.warn).toEqual("function");
        expect(typeof logger.info).toEqual("function");
        expect(typeof logger.http).toEqual("function");
        expect(typeof logger.verbose).toEqual("function");
        expect(typeof logger.debug).toEqual("function");
        expect(typeof logger.silly).toEqual("function");
    });

    describe("Remove", () => {
        it('should remove log files by year', async () => {
            _.ensureDir("logs", "2023", "01");

            writeFileSync(join(process.cwd(), "logs", "2023", "01", "01.log"), "");

            const logger = createFileLogger("my-app");
            await logger.remove("2023");
            await logger.load();

            try {
                await logger.read<LogEntry>();
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message.endsWith('does not exist.')).toEqual(true);
            }
        });
    })

    describe("Write", () => {
        afterEach(async () => {
            await logger.remove()
        })

        it("should save json to file", async () => {
            logger = createFileLogger("my-app");
            logger.info(`Test message`, {someData: "someValue"});

            await logger.load();

            const entries = await logger.read<LogEntry>();

            expect(entries.length).toEqual(1);

            entries.forEach((entry, b) => {
                expect(entry).toHaveProperty("level", `INFO`);
                expect(entry).toHaveProperty("message", `Test message`);
                expect(entry).toHaveProperty("data", {someData: "someValue"});
                expect(entry).toHaveProperty("date");
                expect(entry).toHaveProperty("time");
            });
        });

        it('should default to info level', async () => {
            logger = createFileLogger("my-app");

            logger.error("should log error");
            logger.warn("should log warn");
            logger.info("should log info");
            logger.http("should not log http");
            logger.verbose("should not log http");
            logger.debug("should not log debug");
            logger.silly("should not log silly");

            await logger.load();

            const entries = await logger.read<LogEntry>();

            expect(entries.length).toEqual(3);
        })

        it("should save all levels to file", async () => {
            logger = createFileLogger("my-app", {level: _.logLevelByName.SILLY});

            for (let i = 0; i <= 6; i++) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                logger[_.logLevel[i].toLowerCase() as string](`Test message ${i}`);
            }

            await logger.load();

            const entries = await logger.read<LogEntry>();

            for (let i = 0; i <= 6; i++) {
                expect(entries[i]).toHaveProperty("level", _.logLevel[i])
            }
        })

        it('should ignore higher levels', async () => {
            logger = createFileLogger("my-app", {level: _.logLevelByName.HTTP});

            logger.error("This should be logged");
            logger.warn("This should be logged");
            logger.info("This should be logged");
            logger.http("This should be logged");
            logger.verbose("This should not be logged");
            logger.debug("This should not be logged");
            logger.silly("This should not be logged");

            await logger.load();

            const entries = await logger.read<LogEntry>();

            expect(entries.length).toEqual(4);

            for (let i = 0; i <= 6; i++) {
                if (i <= 3) {
                    expect(entries[i]).toHaveProperty("level", _.logLevel[i]);
                } else {
                    expect(entries[i]).not.toBeDefined();
                }
            }
        })
    })
    describe("Read", () => {
        afterEach(async () => {
            await logger.remove();
            await _t.sleep(100);
        })

        it('should throw if file is not found', async () => {
            logger = createFileLogger("my-app");

            await logger.load();

            try {
                await logger.read();
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
            }
        });

        it('should read text entries', async () => {
            logger = createFileLogger("my-app", {read: {json: false}});

            logger.info("This should be logged 1");
            logger.info("This should be logged 2");
            logger.info("This should be logged 3");

            await logger.load();

            const entries = await logger.read<LogEntry>();

            expect(entries.length).toEqual(3);

            entries.forEach(entry => {
                expect(typeof entry).toEqual("string")
            });
        });

        it('should read across log files', async () => {
            const files: WriteFile[] = [
                {day: "01", month: "01", year: "2023"},
                {day: "02", month: "02", year: "2023"},
                {day: "03", month: "03", year: "2023"},
            ];

            const total = 100;
            const lines = 26;

            logger = createFileLogger("my-app", {read: {lines}});

            _t.genLogEntries(total, logger, files);

            const totalRead = await _t.readEntries({}, logger);

            expect(totalRead).toEqual(total * files.length);
        });

        it('should load log file stats', async () => {
            const files: WriteFile[] = [
                {day: "01", month: "01", year: "2023"},
                {day: "02", month: "02", year: "2023"},
                {day: "03", month: "03", year: "2023"},
            ];

            const total = 100;
            const lines = 26;

            logger = createFileLogger("my-app", {read: {lines}});

            _t.genLogEntries(total, logger, files);

            await logger.load({stats: true});

            logger.files.forEach(file => {
                expect(file.size).not.toBeUndefined()
                expect(file.size && file.size > 0).toEqual(true);
                expect(file.lines).not.toBeUndefined()
                expect(file.lines && file.lines === 100).toEqual(true);
            });
        });

        describe("Filter", () => {
            const files: WriteFile[] = [
                {day: "01", month: "01", year: "2023"},
                {day: "02", month: "02", year: "2023"},
                {day: "03", month: "03", year: "2023"},
                {day: "02", month: "02", year: "2022"},
                {day: "03", month: "03", year: "2022"},
                {day: "04", month: "04", year: "2022"},
                {day: "03", month: "03", year: "2021"},
                {day: "04", month: "04", year: "2021"},
                {day: "05", month: "05", year: "2021"},
            ];

            let startDate: Date;
            let endDate: Date;

            beforeAll(() => {
                logger = createFileLogger("my-app", {level: _.logLevelByName.SILLY});
                startDate = _t.genTestDate(2021).date;
                endDate = _t.genTestDate(2022).date;
            })

            it('should filter by date range', async () => {
                _t.genLogEntries(100, logger, files);

                const afterOpts: Partial<ReadOptions> = {
                    filter: {start: startDate, end: endDate}
                }

                await _t.readEntries(
                    afterOpts, logger, (entries) => {
                        entries.forEach((entry) => {
                            const entryTime = (_.strToDate(entry.date) as Date).getTime();
                            expect(entryTime >= startDate.getTime()).toEqual(true)
                            expect(entryTime <= endDate.getTime()).toEqual(true)
                        })
                    }
                );
            })

            it('should filter by date before', async () => {
                _t.genLogEntries(100, logger, files);

                const beforeOpts: Partial<ReadOptions> = {
                    filter: {end: endDate}
                }

                await _t.readEntries(
                    beforeOpts, logger, (entries) => {
                        entries.forEach((entry) =>
                            expect(_.strToDate(entry.date) <= endDate).toEqual(true)
                        )
                    }
                );
            })

            it('should filter by date after', async () => {
                _t.genLogEntries(100, logger, files);

                const afterOpts: Partial<ReadOptions> = {
                    filter: {start: startDate}
                }

                await _t.readEntries(
                    afterOpts, logger, (entries) => {
                        entries.forEach((entry) =>
                            expect(_.strToDate(entry.date) >= startDate).toEqual(true)
                        )
                    }
                );
            });

            it('should filter by level', async () => {
                const levels = Object.values(_.logLevel);

                const entries = {
                    [_.logLevelByName.ERROR]: 0,
                    [_.logLevelByName.WARN]: 0,
                    [_.logLevelByName.INFO]: 0,
                    [_.logLevelByName.HTTP]: 0,
                    [_.logLevelByName.VERBOSE]: 0,
                    [_.logLevelByName.DEBUG]: 0,
                    [_.logLevelByName.SILLY]: 0,
                };

                _t.genLogEntries(100, logger, files, levels, (entry) => {
                    if (entry) {
                        entries[_.logLevelByName[entry.level as LogLevelName]]++
                    }
                    return entry;
                });

                const readEntries = {
                    [_.logLevelByName.ERROR]: 0,
                    [_.logLevelByName.WARN]: 0,
                    [_.logLevelByName.INFO]: 0,
                    [_.logLevelByName.HTTP]: 0,
                    [_.logLevelByName.VERBOSE]: 0,
                    [_.logLevelByName.DEBUG]: 0,
                    [_.logLevelByName.SILLY]: 0,
                };

                const readOpts: Partial<ReadOptions> = {}

                await _t.readEntries(
                    readOpts, logger, (entries) => {
                        entries.forEach((entry) => {
                            readEntries[_.logLevelByName[entry.level as LogLevelName]]++
                        })
                    }
                );

                levels.forEach((level) => {
                    expect(readEntries[_.logLevelByName[level as LogLevelName]])
                        .toEqual(entries[_.logLevelByName[level as LogLevelName]]);
                })
            });
        });
    });
})

