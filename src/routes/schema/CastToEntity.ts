import { Entity, IEntity, Store } from 'auria-clerk';
import { IRouteRequest } from 'maestro';

export function CastObjectToEntityModel(entity: Entity | [Store, IEntity], pickProps: string[]): (
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

    // Filter props if picked
    if (pickProps.length > 0) {
      Object.entries(value).forEach(
        ([prop]) => {
          if (!pickProps.includes(prop)) {
            delete value[prop];
          }
        });
    }

    // Try to set all values from body
    let success = model.$set(value);
    if (success) {
      request.setOrigin('body', model);
    }

    // Failed to initiate model!
    return request;
  };
};