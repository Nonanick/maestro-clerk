import { Entity, getAsIProperty, IEntity } from "clerk";
import type { JSONSchema7 } from 'json-schema';
import { RouteSchema } from "maestro";
import { GetPropertySchema } from './Util';

export function ShowSchema(entity: Entity): RouteSchema {

  let propertyTypes: {
    [name: string]: JSONSchema7;
  } = {};

  Object.entries(entity.properties)
    .filter(([_, prop]) => {
      prop.isPrivate() !== true;
    }).forEach(([name, prop]) => {
      let schema = GetPropertySchema(prop);
      propertyTypes[name] = schema;
    });

  return {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {}
      }
    },
    response: {
      '2xx': {
        type: 'object',
        properties: {
          ...propertyTypes
        },
        additionalProperties: false,
      },
    }
  };

}