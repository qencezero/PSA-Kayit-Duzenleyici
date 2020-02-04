// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { app, dialog } = require("electron").remote;
const fs = require("fs");
const path = require('path');
const util = require("util");

var fileList = [];
var folderPath = '';
var filename = '';
var outputFile = '';
var colHeadings = '';
var fileHeadings = '';
var fileReadEncoding = '';
var fileWriteEncoding = '';
var fileCounter = 0;
var configsValid = false;

var headings = [
  "Dosya Adı",
  "Dosya Tarihi",
  "Seri No",
  "OP20 Pim-1 çakma kN",
  "Sonuç",
  "OP20 Pim-2 çakma kN",
  "Sonuç",
  "OP20 Tapa çakma kN",
  "Sonuç",
  "OP30 Rulman çakma kN",
  "Sonuç",
  "OP30 Rulman çakma sonu mm",
  "Sonuç",
  "OP30 Kömür çakma kN",
  "Sonuç",
  "OP30 Kömür çakma max. kN",
  "Sonuç",
  "OP30 Kömür çakma sonu mm",
  "Sonuç",
  "OP35 Kömür yükseklik mm",
  "Sonuç",
  "OP40 Kasnak iç çap mm",
  "Sonuç",
  "OP40 Kasnak iç çap ovalite mm",
  "Sonuç",
  "OP40 Kasnak çakma kN",
  "Sonuç",
  "OP40 Pervane iç çap mm",
  "Sonuç",
  "OP40 Pervane iç çap ovalite mm",
  "Sonuç",
  "OP40 Pervane çakma kN",
  "Sonuç",
  "OP50 Boşta dönme kontrolü",
  "Sonuç",
  "OP50 Kasnak yükseklik mm",
  "Sonuç",
  "OP50 Kasnak dış çap ovalite mm",
  "Sonuç",
  "OP50 Pervane yükseklik mm",
  "Sonuç",
  "OP50 Pervane dış çap ovalite mm",
  "Sonuç",
  "OP60 Sıkılık torku Nm",
  "Sonuç",
  "OP70 Sızdırmazlık Pa",
  "Sonuç",
  "OP80 Conta kulak ve kirlilik kamera kontrolü",
  "Sonuç"
];

headings.forEach(function(data, index){
  colHeadings += data + "\t";
});
colHeadings += "\n";

// Disable start button

// Default variables
var fixTabularData = true;
var removeA_A = true;
var tabularColumnNum = 48;

var decimalSeparator = "comma"; // decimalSeparator: comma, point
var readingUnicode = 'binary';  // Encoding: ascii, base64, binary, hex, ucs2, utf8, latin1
var writingUnicode = 'utf8';

function reset() {
  document.getElementById("btn_start").disabled = false;

  var node = document.getElementById('list');
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }

}

function browse() {
  var selectedDir = dialog.showOpenDialogSync({
    buttonLabel: 'Klasör Seç',
    properties: ['openDirectory']
  });
  if (selectedDir === undefined) {
    // alert("Klasör seçilmedi.");
    return;
  }
  document.getElementById('selectedDir').value = selectedDir[0];
  folderPath = selectedDir[0];
  console.log(selectedDir);

  filename = path.basename(folderPath);
  console.log(filename);
}


function save_configs(){

  var el_fixTabularData = document.getElementById('fixTabularData').checked;
  var el_removeA_A = document.getElementById('removeA_A').checked;
  var el_addHeadings = document.getElementById('addHeadings').checked;

  var el_readingUnicode = get_selected("readingUnicode");
  var el_writingUnicode = get_selected("writingUnicode");
  var el_decimalSeparator = get_selected("decimalSeparator");

  fixTabularData = el_fixTabularData;
  removeA_A = el_removeA_A;
  if (el_addHeadings) {
    fileHeadings = colHeadings;
  } else {
    fileHeadings = '';
  }
  readingUnicode = el_readingUnicode;
  writingUnicode = el_writingUnicode;
  decimalSeparator = el_decimalSeparator;

  // console.log("fixTabularData: " + fixTabularData);
  // console.log("removeA_A: " + removeA_A);
  // console.log("addHeadings: " + fileHeadings);
  //
  // console.log("readingUnicode: " + readingUnicode);
  // console.log("writingUnicode: " + writingUnicode);
  // console.log("decimalSeparator: " + decimalSeparator);


  if (fs.existsSync(folderPath)) {
    console.log('Folder exists.');
    if (fs.statSync(folderPath).isDirectory()) {
      console.log('This is a folder');
      configsValid = true;
      // add_new_element("list", "li", "Ayarlar kaydedildi.");
      document.getElementById("btn_start").disabled = false;

    } else {
      alert("Seçilen dosya klasör değil.");
      configsValid = false;
    }
  } else {
    alert("Geçersiz klasör yolu.");
    configsValid = false;
  }

}

function get_selected(id) {
  var e = document.getElementById(id);
  var strUser = e.options[e.selectedIndex].value;
  return strUser;
}

// function openFolder(path){
//   var gui = require('nw.gui');
//   gui.Shell.showItemInFolder(path);
// }

function btn_start() {

  save_configs();

  if (configsValid) {

      var newFileName = "PSA-" + filename + ".txt";
      console.log(newFileName);
      outputFile = path.join(app.getPath('desktop'), newFileName);

      document.getElementById("btn_reset").disabled = true;
      document.getElementById("btn_start").disabled = true;
      document.getElementById('btn_start').innerText = "Çalışıyor...";

      fs.writeFile(outputFile, fileHeadings, (err) => {
        if (err) throw err;

        // Scan files
        add_new_element("list", "li", "Tarama işlemi başladı. Lütfen bekleyiniz.");
        setTimeout(function(){
          walkSync(folderPath, fileList);

          // Write files
          add_new_element("list", "li", "Yazma işlemi başladı.");
          setTimeout(function(){
            fileList.forEach(function(data, index){
              fs.appendFileSync(outputFile, fix_content(data), writingUnicode);
            });

            // Clear changes
            add_new_element("list", "li", fileCounter + " adet dosya işlendi.");
            add_new_element("list", "li", "İşlem tamamlandı. Çıktı dosyası -> " + outputFile);
            document.getElementById('btn_start').innerText = "Tamamlandı";
            document.getElementById("btn_reset").disabled = false;
            fileList = [];
            fileCounter = 0;
          }, 1000);

        }, 1000);

      });
  }

}


function add_new_element (target, element, text){
  var target_element = document.getElementById(target);
  var new_element = document.createElement(element);
  var element_text = document.createTextNode(text);
  new_element.appendChild(element_text);
  list.appendChild(new_element);
}

var walkSync = function(dir, fileList) {
  var fs = fs || require('fs');
  var path = path || require('path');
  var files = fs.readdirSync(dir);
  fileList = fileList || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = walkSync(path.join(dir, file), fileList);
    }
    else {
      fileCounter++;
      fileList.push(path.join(dir, file));
    }
  });
  return fileList;
};

// Converts epoch time to human readable timestamp (for file stats)
function dateFormat(d){
  var _day = ("0" + d.getDate()).slice(-2);
  var _month = ("0"+(d.getMonth()+1)).slice(-2);
  var _year = d.getFullYear();
  var _hours = ("0" + d.getHours()).slice(-2);
  var _minutes = ("0" + d.getMinutes()).slice(-2);
  var _seconds = ("0" + d.getSeconds()).slice(-2);
  var datestring = _year +"-"+ _month +"-"+ _day +" "+ _hours +":"+ _minutes +":"+ _seconds;
  return datestring;
}

function fix_content(filePath){

  // Encoding: ascii, base64, binary, hex, ucs2, utf8, latin1
  var readedFile = fs.readFileSync(filePath, readingUnicode);

  // Remove whitespace from both sides of the whole string
  readedFile = readedFile.trim();

  // Remove \r
  readedFile = readedFile.replace(/\r/g, '');

  // Convert missing values to tab
  readedFile = readedFile.replace(/\s\s\s\s\s\s\s\s\s\s\s/gm, '\tA_A');

  // Convert missing values to tab
  readedFile = readedFile.replace(/mm\s*OK/gm, 'mm\tA_A\tOK');

  // remove spaces before and after \t
  readedFile = readedFile.replace(/( {1,})+\t/g, '\t'); // removes spaces before tab
  readedFile = readedFile.replace(/\t+( {1,})/g, '\t'); // removes spaces after tab

  // remove spaces before and after \n
  readedFile = readedFile.replace(/\n+( {1,})/g, '\n'); // removes spaces before newline
  readedFile = readedFile.replace(/( {1,})+\n/g, '\n'); // removes spaces after newline

  // Remove operation names
  readedFile = readedFile.replace(/^OP([\s\S]*?)(\t\s|\t)/gm, '');

  // Convert '...', '???', 'xxx' values to tab
  readedFile = readedFile.replace(/(\.\.\.)/gm, 'A_A');
  readedFile = readedFile.replace(/(\?\?\?)/gm, 'A_A');
  readedFile = readedFile.replace(/(xxx)/gm, 'A_A');

  // Fix 3 space error
  readedFile = readedFile.replace(/\s\s\s/gm, '\t');

  // Change decimal separator (sometimes it may vary from country to country)
  switch (decimalSeparator) {
    case "comma":
    // If decimal separator is dot changes it to comma
    readedFile = readedFile.replace(/(\d)(\.)(\d)/g, '$1,$3');
    break;

    case "point":
    // If decimal separator is comma changes it to point
    readedFile = readedFile.replace(/(\d)(\,)(\d)/g, '$1.$3');
    break;
  }

  // Change \n (newline) with \t (tab)
  readedFile = readedFile.replace(/\n/g, '\t');

  // Read file stats
  stats = fs.statSync(filePath);

  // Add file last modified datetime (date format is dd-mm-yyyy hh-mm-ss)
  readedFile = dateFormat(stats.mtime) + "\t" + readedFile;

  // Add file name
  readedFile = path.basename(filePath) + "\t" + readedFile;

  // PSA data requires 48 columns
  if (fixTabularData) {
    var count = (readedFile.match(/\t/g) || []).length;
    if (count < tabularColumnNum) {
      var loop = tabularColumnNum - count;
      for (var i = 0; i < loop; i++) {
        readedFile += "\tA_A";
      }
    }
  }

  // Remove A_A strings
  if (removeA_A) {
    readedFile = readedFile.replace(/A_A/gm, '');
  }

  // Add new line at the end of each loop
  readedFile += '\n';

  return readedFile;
}
