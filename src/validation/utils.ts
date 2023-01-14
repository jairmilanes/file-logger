import * as _ from "../_";
import {PropValue} from "./types";

export const message: Record<string, string> = {
    string: "%s must be a string.",
    boolean: "%s must be a boolean.",
    required: "%s is required.",
    number: "%s must be a number.",
    object: "%s must be an object",
    level: "%s must be a level number or name.",
    date: "%s must be a date string or a Date instance."
}

export const isLevel = (v: PropValue): boolean => {
    if (typeof v === "number") return v in _.logLevel;
    if (typeof v === "string") return v.toUpperCase() in _.logLevelByName;
    return false;
};

export const isDate = (v: PropValue): boolean => {
    if (typeof v !== "string" && !v) return false;
    if (v instanceof Date) return true;
    return !isNaN(Date.parse(v as string));
};

export const isExtension = (v: PropValue): boolean => {
    if (typeof v === "string") {
        return v.length > 1 && v.startsWith('.')
    }
    return false;
};
