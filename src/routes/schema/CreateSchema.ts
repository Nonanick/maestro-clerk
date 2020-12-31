import { IEntity, normalizePropertyType } from "auria-clerk";
import { JSONSchema7 } from 'json-schema';
import { RouteSchema } from "maestro";
import { GetPropertySchema } from './Util';

export function CreateSchema(entity: IEntity): RouteSchema {

  // Required props are marked as required and don't have a default value!
  let requiredProps = Object.entries(entity.properties)
    .filter(
      ([name, prop]) => {
        return prop.required === true && prop.default == null;
      }
    )
    .map(([name]) => name);

  let propertyTypes: {
    [name: string]: JSONSchema7;
  } = {};

  for (let propName in entity.properties) {
    let property = entity.properties[propName];
    let schema = GetPropertySchema({ name: propName, ...property });
    propertyTypes[propName] = schema;
  }

  return {
    body: {
      type: 'object',
      required: requiredProps,
      properties: {
        ...propertyTypes
      },
      additionalProperties: false,
    },
    response: {
      '2xx': {
        type: 'object',
        properties: {
          procedure: { type: 'string' },
          model: { type: 'object' },
        },
        additionalProperties: false
      },
      '4xx': {
        type: 'object',
        properties: {
          message: { type: 'string' },
          exitCode: { type: 'string' }
        },
        additionalProperties: true,
      },
      '5xx': {
        type: 'object',
        properties: {
          message: { type: 'string' },
          exitCode: { type: 'string' }
        },
        additionalProperties: true,
      }
    }
  };
}