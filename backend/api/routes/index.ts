import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/test', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Test endpoint!' });
});

export default router;
