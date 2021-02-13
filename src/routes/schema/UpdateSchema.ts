import { Entity } from "clerk";
import { JSONSchema7 } from 'json-schema';
import { RouteSchema } from "maestro";
import { GetPropertySchema } from './Util';

export function UpdateSchema(entity: Entity): RouteSchema {

  let propertyTypes: {
    [name: string]: JSONSchema7;
  } = {};

  for (let propName in entity.properties) {
    let property = entity.properties[propName];
    let schema = GetPropertySchema(property);
    propertyTypes[propName] = schema;
  }

  return {
    body: {
      type: 'object',
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