const express = require('express');
const google = require('googleapis');
const uuid = require('uuid-regexp');
const urlRegex = require('url-regex');

const keys = require('./config/keys');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static(`${__dirname}/public`));

app.get('/favicon.ico', (req, res) => {
  res.status(204);
});

function renderTemplate(rows, matchedItem, result) {
  let listItem = '';
  for (let i = 0; i < rows[0].length; i += 1) {
    if (matchedItem[i] && (matchedItem[i].length > 1)) {
      let text = matchedItem[i];
      const newUrl = text.match(urlRegex());
      if (newUrl) {
        newUrl.forEach((url) => {
          text = text.replace(url, `<a href="${url}">${url}</a>`);
        });
      }
      listItem += `<li>${result[0][i].toUpperCase()}: <span class="detail">${text}</span></li>`;
    }
  }
  return listItem;
}

app.get('/:id', (req, res) => {
  const sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: keys.apiKey,
    spreadsheetId: '1QHKa3vUpht7zRl_LEzl3BlUbolz3ZiL8yKHzdBL42dY',
    range: 'Agora inventory!A:Z',
  }, (err, response) => {
    if (err) {
      console.log(`The API returned an error: ${err}`);
      return;
    }
    const rows = response.values;
    const result = [];

    if (rows.length === 0) {
      console.log('No data found.');
    } else {
      const uuidIndex = rows[0].indexOf('uuid');
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        // console.log(row);
        if (row[uuidIndex]) {
          result.push(row);
        }
      }
      const matchedItem = result.find((item) => {
        if (uuid().test(item)) {
          return uuid().exec(item)[0] === req.params.id;
        }
      });
      if (matchedItem) {
        res.render('item', { item: renderTemplate(rows, matchedItem, result) });
      } else {
        res.render('notFound', {
          item: '',
          id: req.params.id,
        });
      }
    }
  });
});

app.get('/', (req, res) => {
  res.redirect('https://cryptic-woodland-88390.herokuapp.com/');
});

const port = process.env.PORT || 1234;

app.listen(port, () => {
  console.log(`working on ${port}`);
});
