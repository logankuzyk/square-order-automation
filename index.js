const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const write = require('write');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'];
const TOKEN_PATH = 'token.json';

let output = {}

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), openSheet);
});

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function openSheet(auth) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the ID of the order spreadsheet: ', (code) => {
        rl.close()
        if (code.length != 44) {
            console.log('That doesn\'t look like a spreadsheet ID');
            openSheet(auth);
            return;
        }
        processSheet(auth, code);
        return;
    })
  }

function processSheet(auth, id) {
    const sheets = google.sheets({version: 'v4', auth});
    output.picklist = {};
    output.orders = {};
    output.removed = {};
    sheets.spreadsheets.values.get({
        spreadsheetId: id,
        range: 'D2:AU',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            rows.map((row) => {
                if (row[0] != undefined) {
                    if (output.orders[row[0]] == undefined && row[2] != undefined) {
                        output.orders[row[0]] = {
                            'name': row[14] + ' ' + row[15],
                            'street': row[17].replace(/ /g, '+'),
                            'city': 'Victoria',
                            'province': 'BC',
                            'country': 'CA',
                            'type': row[2],
                            'phone': row[23],
                            'email': row[16],
                        }
                        if (row[27] != undefined) {
                            output.orders[row[0]].post = row[27].replace(/ /g, '');
                        } else {
                            output.orders[row[0]].post = '';
                        }
                    }
                    console.log(output.orders[row[0]].date != undefined)
                    if (output.orders[row[0]].type != 'pending') {
                        delete output.orders[row[0]];
                        output.removed[row[0]] = 'not a pending order.';
                    } else if (row[43] != undefined) {
                        delete output.orders[row[0]];
                        output.removed[row[0]] = 'pickup order.';
                    } else {
                        if (row[33] != undefined) {
                            if (row[33].toUpperCase().includes('KEG')) {
                                row[33] += ' ' + row[34];
                            }
                            
                            if (output.picklist[row[33]] == undefined) {
                                output.picklist[row[33]] = Number(row[35]);
                            } else {
                                output.picklist[row[33]] += Number(row[35]);
                            }
                        }
                    }
                }
            });
        } else {
          console.log('No data found.');
        }
        makeCircuit(auth);
        return;
    });
}
// shipping, city, province, zip, email, phone number (headers)
function makeCircuit(auth) {
    console.log(output);
    output.circuit = [];
    for (let key of Object.keys(output.orders)) {
        output.orders[key].circuit = '';
        output.orders[key].circuit += output.orders[key].street + ',,' + output.orders[key].city + ',,' + output.orders[key].province + ',,' + output.orders[key].post + ',,' + output.orders[key].email + ',,' + output.orders[key].phone;
        if (output.orders[key].post != undefined) {
            output.circuit.push([output.orders[key].post, key]);
        } else {
            output.circuit.push(['', key]);
        }
    }
    makeDoc(auth);
    return;
}

function makeDoc(auth) {
    let date = new Date();
    let final = '';
    console.log(output.picklist)
    for (let header of Object.keys(output)) {
        if (header == 'orders') {
            continue;
        }
        final += header.toUpperCase() + '\n';
        if (header == 'circuit') {
            for (let member of output.circuit) {
                final += output.orders[member[1]].circuit + '\n';
            }
        } else if (header == 'picklist') {
            for (let key of Object.keys(output[header])) {
                final += output[header][key] + ', ' + key + '\n';
            }
        } else if (header == 'removed') {
            for (let key of Object.keys(output[header])) {
                final += key + ' removed: ' + output[header][key] + '\n';
            }
        }
    }
    write.sync(date.toDateString() + ' Beer Deliveries' + '.csv', final, {overwrite: true});
    console.log('The text file has been generated.')
}
