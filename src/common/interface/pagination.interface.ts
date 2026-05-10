import { HydratedDocument } from "mongoose";

export interface IPaginate<TRawDocument> {
  docs: HydratedDocument<TRawDocument>[];

  currentPage?: number | string;

  pages?: number | string;

  size?: number | string;
}
