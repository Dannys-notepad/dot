const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('index', {status: 'Offline'});
});

module.exports = router;