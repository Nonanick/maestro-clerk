import { IProcedureResponse } from "clerk";

export class ProcedureFailed extends Error {
  statusCode = 400;

  exitCode = "PROCEDURE_FAILED";

  constructor(response?: IProcedureResponse, ...msg: string[]) {
    super(msg.join(' '));
    if (response != null && response.errors != null) {
      this.message += (Array.isArray(response.errors) ? response.errors.join(', ') : response.errors);
    }
  }
}