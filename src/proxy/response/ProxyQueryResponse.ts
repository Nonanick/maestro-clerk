import { Model } from 'auria-clerk';
import { IProxyResponse, IRouteResponse } from 'maestro';
import { QueryFailed } from '../../errors/QueryFailed';

export const ProxyQueryResponse: IProxyResponse = {
  name: 'transform-query-response',
  apply: async (response: IRouteResponse) => {

    if (response.payload == null) {
      response.status = 201;
      response.payload = [];
    }

    if (response.payload instanceof Error) {
      response.status = 500;
      response.payload = new QueryFailed(response.payload.message);
    }

    if (response.payload instanceof Model) {
      response.payload = await response.payload.$json();
    }

    if (Array.isArray(response.payload)) {
      let newPayload: any[] = [];

      // Transform models
      for (let value of response.payload) {
        if (value instanceof Model) {
          newPayload.push(value.$json());
        } else {
          newPayload.push(value);
        }
      }

      newPayload = await Promise.all(newPayload);
      response.payload = newPayload;
    }

    return response;
  }
};
