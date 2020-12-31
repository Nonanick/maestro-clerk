import { AppError } from "auria-clerk";

export class UnableToListModels extends AppError {
  statusCode = 400;
}