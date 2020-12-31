import { IEntity } from "auria-clerk";
import type { JSONSchema7 } from 'json-schema';
import { RouteSchema } from "maestro";
import { GetPropertySchema } from './Util';

export function ListSchema(entity: IEntity): RouteSchema {

  let propertyTypes: {
    [name: string]: JSONSchema7;
  } = {};


  Object.entries(entity.properties)
    .filter(([name, prop]) => {
      return prop.private !== true;
    }).forEach(([name, prop]) => {
      let schema = GetPropertySchema({ name, ...prop });
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