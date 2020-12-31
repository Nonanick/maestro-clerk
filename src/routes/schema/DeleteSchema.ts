import { IEntity } from "auria-clerk";
import { RouteSchema } from "maestro";

export function DeleteSchema(entity: IEntity): RouteSchema {
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