const router = require('express').Router();

router.get('/', (req, res) => {
  res.render('index', {status: 'Offline'});
});
router.get('/puter-docs', (req, res) => {
  res.render('puterdocs');
});

module.exports = router;