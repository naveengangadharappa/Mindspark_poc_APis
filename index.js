let express = require('express'); 
let app = express();
const path = require('path')
app.use('/', express.static(path.join(__dirname, '/ChromeExtension2')));
app.use('/test',(req,res)=>{
    console.log("Connected to Heroku");
    res.json({status:true,message:"Heroku Connected Successfully"});
})
app.listen(3000);