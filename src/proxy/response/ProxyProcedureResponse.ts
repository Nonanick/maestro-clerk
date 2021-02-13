import { IProxyResponse, IRouteResponse } from 'maestro';
import { IProcedureResponse } from 'clerk';
import { ProcedureFailed } from '../../errors/ProcedureFailed';

export const ProxyProcedureResponse: IProxyResponse = {
  name: 'transform-procedure-response',
  apply: async (response: IRouteResponse) => {


    if (response.payload == null) {
      response.status = 500;
      response.payload = new ProcedureFailed(undefined, "Failed to run procedure! Check Server for errors!");
    }

    if (response.payload instanceof Error) {
      response.status = 400;
      response.payload = new ProcedureFailed(undefined, response.payload.message);
    }

    if (implementsProcedureResponse(response.payload)) {

      if (!response.payload.success) {
        response.status = 400;

        response.payload = new ProcedureFailed(response.payload);
      } else {
        let res = response.payload;

        response.exitCode = "REQUEST_FILLFILED.PROCEDURE_EXECUTED";
        response.payload = {
          procedure: res.procedure,
          model: res.model
        };
      }
    }

    return response;
  }
};

function implementsProcedureResponse(payload: any): payload is IProcedureResponse {
  return (
    typeof payload.procedure === "string"
    && typeof payload.success === 'boolean'
    && typeof payload.request === 'object'
    && typeof payload.model === 'object'
  );
};