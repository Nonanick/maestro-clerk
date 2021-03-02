import { Entity, IEntity, Store, StoredEntity } from "clerk";
import {
  Controller,
  IProxiedRoute,
  IRouteRequest,
  MaybePromise,
  Resolver,
  RouteSchema,
} from "maestro";
import { ProxyProcedureResponse } from "../proxy/response/ProxyProcedureResponse";
import { ProxyQueryResponse } from "../proxy/response/ProxyQueryResponse";
import { CreateSchema } from "../routes/schema/CreateSchema";
import { DeleteSchema } from "../routes/schema/DeleteSchema";
import { ListSchema } from "../routes/schema/ListSchema";
import { QuerySchema } from "../routes/schema/QuerySchema";
import { ShowSchema } from "../routes/schema/ShowSchema";
import { UpdateSchema } from "../routes/schema/UpdateSchema";


export class EntityController extends Controller {
  protected proceduresRoutes: {
    [name: string]: IProxiedRoute;
  } = {};

  get baseURL(): string {
    return this.entity.name.replace(/_/g, "-").trim().toLocaleLowerCase();
  }

  get listApiRoute(): CtrlAddApiRoute {
    return {
      url: "",
      methods: "get",
      resolver: this.list.bind(this),
      schema: ListSchema(this.entity),
      requestProxies: [],
      responseProxies: [ProxyQueryResponse],
    };
  }

  get showApiRoute(): CtrlAddApiRoute {
    return {
      url: ":id",
      methods: "get",
      resolver: this.show.bind(this),
      schema: ShowSchema(this.entity),
      requestProxies: [],
      responseProxies: [ProxyQueryResponse],
    };
  }

  get queryApiRoute(): CtrlAddApiRoute {
    return {
      url: "query",
      methods: "post",
      resolver: this.query.bind(this),
      schema: QuerySchema(this.entity),
      requestProxies: [],
      responseProxies: [ProxyQueryResponse],
    };
  }

  get createApiRoute(): CtrlAddApiRoute {
    return {
      url: "new",
      methods: "post",
      resolver: this.create.bind(this),
      schema: CreateSchema(this.entity),
      requestProxies: [],
      responseProxies: [ProxyProcedureResponse],
      validate: async () => {
        return true;
      },
    };
  }

  get updateApiRoute(): CtrlAddApiRoute {
    return {
      url: ":id",
      methods: "patch",
      resolver: this.update.bind(this),
      schema: UpdateSchema(this.entity),
      requestProxies: [],
      responseProxies: [ProxyProcedureResponse],
    };
  }

  get deleteApiRoute(): CtrlAddApiRoute {
    return {
      url: ":id",
      methods: "delete",
      resolver: this.delete.bind(this),
      schema: DeleteSchema(),
      requestProxies: [],
      responseProxies: [ProxyProcedureResponse],
    };
  }

  get entity(): StoredEntity {
    let entityName: string;

    if (typeof this._entity === "string") {
      entityName = this._entity;
    } else {
      entityName = this._entity.name;
    }

    return this.store.entity(entityName);
  }

  constructor(
    protected store: Store,
    protected _entity: Entity | IEntity | string,
    options?: {
      disable?: {
        describe?: boolean;
        list?: boolean;
        show?: boolean;
        query?: boolean;
        create?: boolean;
        update?: boolean;
        delete?: boolean;
        [name: string]: boolean | undefined;
      };
    },
  ) {
    super();

    // List
    if (options?.disable?.list !== true) {
      this.addApiRoute(this.listApiRoute);
    }

    // Show
    if (options?.disable?.show !== true) {
      this.addApiRoute(this.showApiRoute);
    }

    // Query Route
    if (options?.disable?.query !== true) {
      this.addApiRoute(this.queryApiRoute);
    }

    // Add
    if (options?.disable?.create !== true) {
      this.addApiRoute(this.createApiRoute);
    }

    // Update
    if (options?.disable?.update !== true) {
      this.addApiRoute(this.updateApiRoute);
    }

    // Delete
    if (options?.disable?.delete !== true && this.hasProcedure("delete")) {
      this.addApiRoute(this.deleteApiRoute);
    }

  }

  getStore() {
    return this.store;
  }

  getStoreEntity() {
    return this.store.entity(this.entity.name);
  }

  guardAccessTo(
    procedure: string,
    guard: (request: IRouteRequest) => MaybePromise<true>,
  ) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.requestProxies.push(guard);
        break;
      }
    }
  }

  useSchema(procedure: string, schema: RouteSchema) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.schema = schema;
        break;
      }
    }
  }

  useResolver(procedure: string, resolver: Resolver) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.resolver = resolver;
        break;
      }
    }
  }

  useCaster(
    procedure: string,
    caster: (request: IRouteRequest) => Promise<IRouteRequest>,
  ) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.cast = caster;
        break;
      }
    }
  }

  hasProcedure(procedure: string): boolean {
    return this.getStoreEntity().proceduresFor.model[procedure] != null;
  }

  hasEntityProcedure(procedure: string): boolean {
    return this.getStoreEntity().proceduresFor.entity[procedure] != null;
  }

  async list() {
    let allModels = await this.getStoreEntity().query().fetch(true);

    return allModels;
  }

  async show(request: IRouteRequest) {
    let modelById = await this.getStoreEntity()
      .query({
        filters: {
          "by-id": [
            this.getStoreEntity()!.identifier.name,
            "=",
            request.get("id", "url"),
          ],
        },
      })
      .fetchOne(true);

    return modelById;
  }

  async query(request: IRouteRequest) {
    let queriedModels = await this.getStoreEntity()!
      .query(request.byOrigin!.body)
      .fetch();

    if (queriedModels instanceof Error) {
      return queriedModels;
    }

    if (queriedModels == null) {
      return [];
    }

    return queriedModels
      .map((model) =>
        model
          .$json()
          .then((obj: any) => {
            // only return requested props
            if (request.byOrigin!.body?.properties != null) {
              let ret: any = {};
              for (let propName of request.byOrigin!.body?.properties) {
                ret[propName] = obj[propName];
              }
              return ret;
            } else {
              return obj;
            }
          })
      );
  }

  async create(request: IRouteRequest) {
    if (!this.hasProcedure("create")) {
      return new Error(
        "Failed to find procedure 'create' on entity " + this.entity.name,
      );
    }

    const model = this.getStoreEntity()!.model();

    if (request.byOrigin?.body == null) {
      return new Error("Empty body!");
    }

    model.$set(request.byOrigin.body);

    return model.$execute("create");
  }

  async update(request: IRouteRequest) {
    if (!this.hasProcedure("update")) {
      return new Error(
        "Failed to find procedure 'update' on entity " + this.entity.name,
      );
    }

    let model = await this.getStoreEntity()
      .query({
        filters: {
          "by-id": [
            this.getStoreEntity().identifier.name,
            "=",
            request.get("id", "url"),
          ],
        },
      })
      .fetchOne();

    if (model instanceof Error) {
      return model;
    }

    if (model == null) {
      return new Error("Could not find match with " + request.get("id", "url"));
    }

    await model.$set(request.byOrigin!.body);

    return model.$execute("delete");
  }

  async delete(request: IRouteRequest) {
    let model = await this.getStoreEntity()
      .query({
        filters: {
          "by-id": [
            this.getStoreEntity().identifier.name,
            "=",
            request.get("id", "url"),
          ],
        },
      })
      .fetchOne();

    if (model instanceof Error) {
      return model;
    }

    if (model == null) {
      return new Error("Could not find match with " + request.get("id", "url"));
    }

    return model.$execute("delete");
  }
}

export type CtrlAddApiRoute = Pick<
  IProxiedRoute,
  | "requestProxies"
  | "responseProxies"
  | "url"
  | "methods"
  | "resolver"
  | "schema"
  | "cast"
  | "validate"
>;
