import app from './app.js';
import http from 'http';

const server = http.createServer(app);

const port = parseInt(process.env.PORT || '3000', 10);

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});