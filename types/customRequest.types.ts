import { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Winston } from 'winston';

export interface CustomRequest extends Request{
  logger: Winston,
  isAdmin: () => boolean,
  model: (schema: string) => MongooseSchema
}