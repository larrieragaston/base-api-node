import { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Winston } from 'winston';
import { CustomConfig } from './customConfig.types';

export interface CustomDatabase{
  config: CustomConfig,
  isAdmin: () => boolean,
  model: (schema: string) => MongooseSchema
}