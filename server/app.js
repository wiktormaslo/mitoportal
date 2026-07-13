const express = require('express');
const path = require('path');

require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', require('./routes/wiki'));
app.use('/api', require('./routes/map'));
app.use('/api', require('./routes/weather'));
app.use('/api', require('./routes/story'));
app.use('/api', require('./routes/guestbook'));
app.use('/api', require('./routes/misc'));

app.listen(PORT, () => {
  console.log(`>>> MITOPORTAL dziala na http://localhost:${PORT} <<<`);
  console.log('Powered by PRT.FM');
});
