import { Entity, IEntity, Store } from "clerk";
import { JSONSchema7 } from 'json-schema';
import { ObjectSchema } from 'maestro/dist/route/schema/CustomSchemas';

export function SchemaFromEntity(entity: Entity | [Store, IEntity], pickProps: string[] = []): ObjectSchema {

  const schema: ObjectSchema = {
    type: 'object',
    properties: {},
    required: [],
  };


  let useEntity: Entity;

  if (entity instanceof Entity) {
    useEntity = entity;
  } else {
    if (entity[0].hasEntity(entity[1].name) === false) {
      entity[0].add(entity[1]);
    }
    useEntity = entity[0].entity(entity[1].name)!;
  }

  // Generate each property
  for (let propName in useEntity.properties) {

    // Skip unwanted props
    if (pickProps.length != 0 && !pickProps.includes(propName)) continue;

    const property = useEntity.properties[propName]!;
    const rawType = property.getType();

    let propertySchema: JSONSchema7;

    switch (rawType.name) {
      case 'String':
        propertySchema = { type: 'string', };
        if (property.hasDefault()) propertySchema.default = String(property.syncGetDefault());
        break;
      case 'Boolean':
        propertySchema = { type: 'boolean' };
        break;
      case 'Date':
        propertySchema = { type: 'string' };
        break;
      default:
        propertySchema = {
          type: 'string',
        };
    }


    (schema.properties as any)[propName]! = propertySchema;

    // Required
    if (property.isRequired() === true) {
      (schema.required as Array<string>).push(propName);
    }

  }

  return schema;
};
