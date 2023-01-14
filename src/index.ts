import { FileLogger } from "./logger";
import {Options, RecursivePartial} from "./types";

export * from "./entry";
export * from "./types";
export * from "./logger";

export default function createFileLogger(name: string, opts: RecursivePartial<Options> = {}) {
    return new FileLogger(name, opts);
}
