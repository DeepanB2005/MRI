const express = require('express')
const app = express();
const PORT = 3000;
const cors = require('cors')

app.use(cors());


app.use(express.json());

app.get('/api/first',(req,res)=>{
  res.json({mj:"hello react this is express"});
});

app.post('/api/ip',(req,res)=>{
  const { ms } =req.body;
  console.log("success");
  res.json({st:"success",reply:`${ms}`})
});

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});