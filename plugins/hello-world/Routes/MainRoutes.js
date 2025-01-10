const expres = require('express');
const router = expres.Router();
const Controller = require('../Controller/Controller')

router.get('/hello', Controller.hello); 


module.exports = router