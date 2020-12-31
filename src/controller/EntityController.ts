import { IEntity, Store } from "auria-clerk";
import { Controller, IProxiedRoute, IRouteRequest, MaybePromise, Resolver, RouteSchema } from "maestro";
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
    return this.entity.name.replace(/_/g, '-').trim().toLocaleLowerCase();
  }

  constructor(
    protected store: Store,
    protected entity: IEntity,
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
    }
  ) {
    super();

    // List
    if (options?.disable?.list !== true) {
      this.addApiRoute({
        url: '',
        methods: 'get',
        resolver: this.list.bind(this),
        schema: ListSchema(this.entity),
        requestProxies: [],
        responseProxies: [ProxyQueryResponse]
      });
    }

    // Show
    if (options?.disable?.show !== true) {
      this.addApiRoute({
        url: ':id',
        methods: 'get',
        resolver: this.show.bind(this),
        schema: ShowSchema(this.entity),
        requestProxies: [],
        responseProxies: [ProxyQueryResponse]
      });
    }

    // Query Route
    if (options?.disable?.query !== true) {
      this.addApiRoute({
        url: 'query',
        methods: 'post',
        resolver: this.query.bind(this),
        schema: QuerySchema(this.entity),
        requestProxies: [],
        responseProxies: [ProxyQueryResponse]
      });
    }

    // Add 
    if (options?.disable?.create !== true && this.hasProcedure('create')) {
      this.addApiRoute({
        url: 'new',
        methods: 'post',
        resolver: this.create.bind(this),
        schema: CreateSchema(this.entity),
        requestProxies: [],
        responseProxies: [ProxyProcedureResponse],
        validate: async (req) => {
          return true;
        }
      });
    }

    // Update 
    if (options?.disable?.update !== true && this.hasProcedure('update')) {
      this.addApiRoute({
        url: ':id',
        methods: 'patch',
        resolver: this.update.bind(this),
        schema: UpdateSchema(this.entity),
        requestProxies: [],
        responseProxies: [ProxyProcedureResponse]
      });
    }

    // Delete 
    if (options?.disable?.delete !== true && this.hasProcedure('delete')) {
      this.addApiRoute({
        url: ':id',
        methods: 'delete',
        resolver: this.delete.bind(this),
        schema: DeleteSchema(this.entity),
        requestProxies: [],
        responseProxies: [ProxyProcedureResponse]
      });
    }

    // Generate procedure routes ?

  }

  getStore() {
    return this.store;
  }

  getEntity() {
    return this.store.entity(this.entity.name);
  }

  guardAccessTo(procedure: string, guard: (request: IRouteRequest) => MaybePromise<true>) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.requestProxies.push(guard);
        break;
      }
    };
  }

  useSchema(procedure: string, schema: RouteSchema) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.schema = schema;
        break;
      }
    };
  }

  useResolver(procedure: string, resolver: Resolver) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.resolver = resolver;
        break;
      }
    };
  }

  useCaster(procedure: string, caster: (request: IRouteRequest) => Promise<IRouteRequest>) {
    for (let route of this._apiRoutes) {
      if (route.resolver === (this as any)[procedure]) {
        route.cast = caster;
        break;
      }
    };
  }

  hasProcedure(procedure: string): boolean {
    return this.entity.procedures?.ofModel?.[procedure] != null;
  }

  hasEntityProcedure(procedure: string): boolean {
    return this.entity.procedures?.ofEntity?.[procedure] != null;
  }


  async list(request: IRouteRequest) {

    let allModels = await this.getEntity()?.query().fetch(true);

    return allModels;
  };

  async show(request: IRouteRequest) {
    let modelById = await this.getEntity()?.
      query({
        filters: {
          'by-id': [this.getEntity()!.identifier.name, '=', request.get('id', 'url')]
        }
      })
      .fetchOne(true);

    return modelById;
  }

  async query(request: IRouteRequest) {

    let queriedModels = await this.getEntity()!
      .query(request.byOrigin!.body)
      .fetch();

    if (queriedModels instanceof Error) {
      return queriedModels;
    }

    if (queriedModels == null) {
      return [];
    }

    return queriedModels
      .map(model => model
        .$json()
        .then(obj => {
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
    const model = this.getEntity()!.model();
    if (request.byOrigin?.body == null) {
      return new Error('Empty body!');
    }
    await model.$set(request.byOrigin.body);
    return await model.$execute('create');
  }

  async update(request: IRouteRequest) {
    let model = await this.getEntity()
      .query({
        filters: {
          'by-id': [this.getEntity().identifier.name, '=', request.get('id', 'url')]
        }
      })
      .fetchOne();

    if (model instanceof Error) {
      return model;
    }

    if (model == null) {
      return new Error('Could not find match with ' + request.get('id', 'url'));
    }

    await model.$set(request.byOrigin!.body);

    return model.$execute('delete');
  }

  async delete(request: IRouteRequest) {
    let model = await this.getEntity()
      .query({
        filters: {
          'by-id': [this.getEntity().identifier.name, '=', request.get('id', 'url')]
        }
      })
      .fetchOne();

    if (model instanceof Error) {
      return model;
    }

    if (model == null) {
      return new Error('Could not find match with ' + request.get('id', 'url'));
    }

    return model.$execute('delete');
  }

}