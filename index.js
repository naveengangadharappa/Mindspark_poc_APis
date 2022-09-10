let express = require('express'); 
let app = express();
const path = require('path');

app.use('/', express.static(path.join(__dirname, '/ChromeExtension2')));
app.use('/test',(req,res)=>{
    console.log("Connected to Heroku");
    res.json({status:true,message:"Heroku Connected Successfully"});
});
const server = app.listen(5000, () => {
    const port = server.address().port;
    console.log(`Express is working on port ${port}`);
  });
//app.listen(3000);