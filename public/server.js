// server.js
import express from 'express';


const app = express();
const PORT = process.env.PORT || 3000;

// serve everything in this folder as static files
app.use(express.static('.'));

app.listen(PORT, () => console.log(`Dev server running at http://localhost:${PORT}`));
