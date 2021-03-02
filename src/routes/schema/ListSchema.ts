import { Entity, getAsIProperty, IEntity } from "clerk";
import type { JSONSchema7 } from 'json-schema';
import { RouteSchema } from "maestro";
import { GetPropertySchema } from './Util';

export function ListSchema(entity: Entity): RouteSchema {

  let propertyTypes: {
    [name: string]: JSONSchema7;
  } = {};


  Object.entries(entity.properties)
    .filter(([name, prop]) => {
      return prop.isPrivate() !== true;
    }).forEach(([name, prop]) => {
      let schema = GetPropertySchema(prop);
      propertyTypes[name] = schema;
    });

  return {
    response: {
      '2xx': {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ...propertyTypes
          },
          additionalProperties: false,
        },
      }
    }
  };
}