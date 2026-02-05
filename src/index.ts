import express from 'express';
import { Request, Response, NextFunction} from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('Hello, Librarian!');
});

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});