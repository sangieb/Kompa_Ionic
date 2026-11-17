import { Request, Response } from 'express';

import { config } from '../config';

export const health = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    servicio: 'kompa-api',
    app: 'Kompa',
    hora: new Date().toISOString(),
  });
};
