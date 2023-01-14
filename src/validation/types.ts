import {LogLevelName} from "../types";

export type PropValue = string | number | boolean | LogLevelName | Date | unknown;

export type ValidationFunction = (v: PropValue) => boolean;

export interface Validation {
    fn: ValidationFunction;
    message: string;
}

export interface PropDefinition {
    name: string;
    type?: string;
    required?: boolean;
    validations?: Validation[],
    children?: PropDefinition[];
}

export interface Schema {
    children: PropDefinition[]
}

export interface ValidationResult {
    [group: string]: string | ValidationResult;
}
