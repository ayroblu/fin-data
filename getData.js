var fs = require('fs');

function CSVToArray( strData, strDelimiter ){
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp((
    // Delimiters.
    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

    // Quoted fields.
    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

    // Standard fields.
    "([^\"\\" + strDelimiter + "\\r\\n]*))"
  ), "gi");

  var arrData = [[]];
  var arrMatches = null;
  while (arrMatches = objPattern.exec( strData )){
      var strMatchedDelimiter = arrMatches[ 1 ];
      if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter){
        arrData.push([]);
      }
      var strMatchedValue;
      if (arrMatches[ 2 ]){
        strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ), "\"");
      } else {
        strMatchedValue = arrMatches[ 3 ];
      }
      arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  return( arrData );
}
var Tests = {
  run(){
    // Nothing yet...
  }
, checkSomething(){
  }
}
var Quandl = {
  convertCsv: true
, getListOfDatabases(page=1, callback){
    var url = 'https://www.quandl.com/api/v3/databases.csv?page='+page
    fetch(url).then(res=>{
      if (res.ok){
        return res.text();
      }
      var error = new Error(res.statusText)
      error.response = res
      throw error
    }).then(text=>{
      if (this.convertCsv){
        var data = CSVToArray(text);
        callback(data);
      } else {
        callback(text);
      }
    }).catch(this.handleError.bind(this));
  }
, getListOfDataSetsInDatabases(dbCode, callback){
    //var url = 'https://www.quandl.com/api/v3/databases.csv'
    var url = `https://www.quandl.com/api/v3/databases/${dbCode}/codes.csv`
    fetch(url).then(res=>{
      if (res.ok){
        return res.text();
      }
      var error = new Error(res.statusText)
      error.response = res
      throw error
    }).then(text=>{
      if (this.convertCsv){
        var data = CSVToArray(text);
        callback(data);
      } else {
        callback(text);
      }
    }).catch(this.handleError.bind(this));
  }
, handleError(err){
    console.error('Error in Quandl:', err);
  }
}
var Cacher = {
  get(url, func){
    if (!this.inCache(url)){
      this.getFromUrl(url, func);
    }
  }
, inCache(url){
  }
, getFromUrl(url, func){
  }
, fileExists(filePath){
    try{
      fs.statSync(filePath);
    }catch(err){
      if(err.code == 'ENOENT') return false; // not sure what
      return false;
    }
    return true;
  }
}
function run(){
  Quandl.getListOfDatabases(data=>{
    var headers = data.splice(0,1)
    var bodyData = data.slice(0,-1)
    Displayer.showTable(headers, bodyData)
    var codeIdx = headers ? headers[0].indexOf('database_code') : -1
    if (codeIdx === -1) {
      console.log('No code:', codeIdx);
      return
    }
    var codes = bodyData.map(d=>d[codeIdx]);
    codes.forEach(code=>{
      console.log('code: ', code);
      Quandl.getListOfDataSetsInDatabases(code, data=>{
        console.log(code, data);
      })
    });
  });
}
run();
