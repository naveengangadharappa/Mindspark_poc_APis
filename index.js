let express = require('express'); 
let app = express();
const cors = require('cors');
const path = require('path');
app.use(cors({
    origin: "*",
    methods: "GET,POST",
    preflightContinue: false,
})); 

app.use('/chrome', express.static(path.join(__dirname, '/ChromeExtension2')));
app.use('/', express.static(path.join(__dirname, '/offline')));
app.use('/test',(req,res)=>{
    console.log("Connected to Heroku");
    res.json({status:true,message:"Heroku Connected Successfully"});
});
const server = app.listen(process.env.PORT || 3000, () => {
    const port = server.address().port;
    console.log(`Express is working on port ${port}`);
  });
//app.listen(3000);