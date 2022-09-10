let express = require('express'); 
let app = express();
const path = require('path')
app.use('/', express.static(path.join(__dirname, '/ChromeExtension2')));

app.listen(3000);