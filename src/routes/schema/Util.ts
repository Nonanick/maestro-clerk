import { IProperty, normalizePropertyType } from 'auria-clerk';
import { JSONSchema7 } from 'json-schema';

export function GetPropertySchema(property: IProperty): JSONSchema7 {

  let schema: JSONSchema7 = {};

  let normalized = normalizePropertyType(property.type) as any;
  let rawType = normalized.raw;

  switch (rawType.name) {
    case 'String':
      schema = {
        type: 'string',
        minLength: normalized.minLength,
        maxLength: normalized.maxLength,
        pattern: normalized.pattern,
        format: normalized.format,
      };

      break;
    case 'Date':
      schema = {
        type: 'string',
        format: 'date',
      };

      break;
    case 'Boolean':
      schema = {
        type: 'boolean',
      };

      break;
    case 'Number':
      schema = {
        type: 'number',
      };

      break;
    case 'Object':
      schema = {
        type: 'object'
      };

      break;
    default:
      schema = {};
  }


  return schema;
}