import { IEntity, PropertyComparisonArray } from "auria-clerk";
import { JSONSchema7 } from 'json-schema';
import { RouteSchema } from "maestro";
import { GetPropertySchema } from './Util';

export function QuerySchema(entity: IEntity): RouteSchema {

  let allPublicProps = Array.from(Object.entries(entity.properties))
    .filter(([name, prop]) => {
      return prop.private !== true;
    })
    .map(([name, prop]) => name)
    .concat(entity.identifier?.name ?? '_id');

  let allRelatedProps = Array.from(Object.entries(entity.properties))
    .filter(([name, prop]) => {
      return prop.relatedTo != null;
    })
    .map(([name, prop]) => name);

  if (allRelatedProps.length < 1) {
    allRelatedProps.push('none');
  }

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
    body: {
      type: 'object',
      properties: {

        // Return properties
        properties: {
          type: 'array',
          items: {
            type: 'string',
            enum: allPublicProps
          },
          maxItems: 20,
          minItems: 1,
          uniqueItems: true,
          additionalItems: false,
        },

        // Filter by
        filters: {
          type: 'object',
          patternProperties: {
            "": {
              type: "array",
              items: [
                { type: "string", enum: allPublicProps },
                { type: "string", enum: [...PropertyComparisonArray] },
                {}
              ],
            }
          },
          maxProperties: 20,
          minProperties: 1
        },

        // Limit by
        limit: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: {
              type: "number",
              minimum: 0,
            },
            offset: {
              type: "number",
              minimum: 0,
            }
          }
        },

        // Include relations
        include: {
          type: "array",
          enum: allRelatedProps
        },

        // Order by
        order: {
          type: ["array", "object"],
          items: {
            type: "object",
            required: ['by'],
            properties: {
              by: {
                type: "string",
                enum: allPublicProps,
              },
              direction: {
                type: "string",
                enum: ["asc", "desc"]
              }
            }
          },
          required: ['by'],
          properties: {
            by: {
              type: "string",
              enum: allPublicProps,
            },
            direction: {
              type: "string",
              enum: ["asc", "desc"]
            }
          }
        }

      },
      additionalProperties: false,
    },

    response: {
      '2xx': {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ...propertyTypes
          },
          additionalItems: false
        }
      }
    }
  };
}