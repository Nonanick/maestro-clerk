import { Entity, IEntity, Store } from 'clerk';
import { IRouteRequest } from 'maestro';

export function CastObjectToEntityModel(entity: Entity | [Store, IEntity], pickProps: string[] | "public" = "public"): (
  (request: IRouteRequest) => Promise<IRouteRequest>
) {

  return async (request: IRouteRequest) => {

    // Can only cast objects!
    if (typeof request.byOrigin?.body !== "object") {
      return request;
    }

    let value = request.byOrigin?.body;

    // Create model
    let useEntity: Entity;

    if (entity instanceof Entity) {
      useEntity = entity;
    } else {
      let store = entity[0];
      let ient = entity[1];

      if (store.hasEntity(ient.name) === false) {
        store.add(ient);
      }

      useEntity = store.entity(ient.name);

    }
    const model = useEntity.model();

    // Force creation of default values
    await model.$json();

    let setProperties: string[];

    // Filter props if picked
    if (pickProps === "public") {
      setProperties = Object.entries(useEntity.properties)
        .filter(([_, prop]) => {
          return !prop.isPrivate();
        }).map(([propertyName]) => propertyName);

    } else {
      Object.entries(value).forEach(
        ([prop]) => {
          if (!pickProps.includes(prop)) {
            delete value[prop];
          }
        });
        setProperties = pickProps;
    }

    let setValues : any= {};
    for(let prop of setProperties) {
      setValues[prop] = value[prop];
    }

    // Try to set all values from body
    let success = model.$set(
      setValues
    );

    if (success) {
      request.setOrigin('body', model);
    }

    // Failed to initiate model!
    return request;
  };
};