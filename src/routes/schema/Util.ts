import { IStringType, normalizePropertyType, Property } from 'clerk';
import { JSONSchema7 } from 'json-schema';

export function GetPropertySchema(property: Property): JSONSchema7 {

  let schema: JSONSchema7 = {};

  let normalized : any = property.getType();
  let rawType = normalized.raw;

  switch (rawType.name) {
    case 'String':
      let stringType = <IStringType>normalized;
      schema = {
        type: 'string',
        minLength: stringType.minLength,
        maxLength: stringType.maxLength,
        pattern: stringType.pattern,
        format: stringType.format,
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