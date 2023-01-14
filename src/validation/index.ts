import util from "util";
import {Options, ReadOptions, WriteOptions} from "../types";
import {PropDefinition, ValidationResult} from "./types";
import {schema} from "./schema";
import {message} from "./utils";

function isValid(options: Record<string, unknown>, props: PropDefinition[]): ValidationResult | boolean {
    const validation = props.reduce((result, prop) => {
        if (prop.type !== "boolean" && !options[prop.name]) {
            if (prop.required) {
                result[prop.name] = util.format(message.required, prop.name);
            }
            return result;
        }

        if (prop.type) {
            if (typeof options[prop.name] !== prop.type) {
                result[prop.name] = util.format(message[prop.type], prop.name);
                return result;
            }
        }

        if (prop.validations) {
            const error = prop.validations
                .reduce((error: string | null, validation) => {
                    if (error) return error;
                    if (!validation.fn(options[prop.name])) {
                        return util.format(validation.message, prop.name)
                    }
                    return error;
                }, null);

            if (error) {
                result[prop.name] = error;
            }
        }

        if (prop.children) {
            const validation = isValid(options[prop.name] as Record<string, unknown>, prop.children);

            if (typeof validation !== "boolean") {
                result[prop.name] = validation;
            }
        }

        return result;
    }, {} as ValidationResult);

    if (Object.keys(validation).length) {
        return validation;
    }

    return true;
}

export function validate(options: Options | ReadOptions | WriteOptions, propName?: string): boolean | ValidationResult {
    if (propName) {
        const writeSchema = schema.children.find(prop => prop.name === propName)

        return isValid(options,  writeSchema?.children as PropDefinition[]);
    }

    return isValid(options, schema.children);
}
