import { AppError } from "clerk";

export class UnableToListModels extends AppError {
  statusCode = 400;
}