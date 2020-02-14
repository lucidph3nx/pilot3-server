const http = require('http');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const parseString = require('xml2js').parseString;
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = {
  maximoNISList: function(maximoTokens) {
    let viewingSessionId;
    const tokens = maximoTokens.token;
    let cookies = '';
    // eslint-disable-next-line guard-for-in
    tokens.cookies.forEach(function(item) {
      cookies += item.name + '=' + item.value + ';';
    });
    return new Promise(function(resolve, reject) {
      const options = {
        'method': 'POST',
        'hostname': '192.168.103.11',
        'path': '/maximo/report?__report=Z51_WONTRList.rptdesign&appname=PLUSTWO' +
          '&__requestid=' + tokens.__requestid +
          '&uisessionid=' + tokens.uisessionid +
          '&csrftoken=' + tokens.csrftoken,
        'headers': {
          'Cookie': cookies,
        },
      };
      const postRequest = http.request(options, function(res) {
        const chunks = [];
        res.on('data', function(chunk) {
          chunks.push(chunk);
        });
        res.on('end', function() {
          const body = Buffer.concat(chunks);
          const xml = entities.decode(body.toString());
          const idLocationStart = xml.search('viewingSessionId = ')+20;
          const idLocationEnd = xml.search('viewingSessionId = ')+39;
          viewingSessionId = xml.substring(idLocationStart, idLocationEnd);
          resolve(new Promise(function(resolve, reject) {
            const options = {
              'method': 'POST',
              'hostname': '192.168.103.11',
              'path': '/maximo/report?__report=Z51_WONTRList.rptdesign&appname=PLUSTWO' +
                '&__requestid=' + tokens.__requestid +
                '&uisessionid=' + tokens.uisessionid +
                '&csrftoken=' + tokens.csrftoken +
                '&__sessionId=' + viewingSessionId +
                '&__dpi=96',
              'headers': {
                'request-type': 'SOAP',
                'SOAPAction': '""',
                'Cookie': cookies,
              },
            };
            const postTime = moment().format('YYYY-M-D-H-m-s-S');
            // eslint-disable-next-line max-len
            const postData = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetUpdatedObjects xmlns="http://schemas.eclipse.org/birt"><Operation><Target><Id>Document</Id><Type>Document</Type></Target><Operator>GetPage</Operator><Oprand><Name>where</Name><Value>%EF%BE%84%EF%BE%8D%EF%BF%87%12Sa%06%EF%BE%A2%EF%BF%8A%06%EF%BF%96j%EF%BF%BF%EF%BE%9A%07%EF%BF%B7%EF%BF%82%11%1A%EF%BE%99%EF%BF%85%EF%BF%8E%EF%BF%AD%2C%26%EF%BF%83%EF%BF%8AR%EF%BF%91b%EF%BE%BA%EF%BF%80+%EF%BF%AF%EF%BE%97T%7C%00E-hZB%2Cs%EF%BF%AF%7D%EF%BE%A1%EF%BE%AD%EF%BE%8Er%7ED%EF%BE%8C7Y%13%1BSk%EF%BE%BB%EF%BE%A6%EF%BF%B7%EF%BE%BF%EF%BF%B4%EF%BF%81%EF%BE%89%27%21%EF%BF%81%EF%BE%87%12%7E%7F%5E%EF%BE%89%EF%BE%BC%EF%BF%AE%EF%BE%A8%EF%BE%90%EF%BF%BD%EF%BE%9D%7E%EF%BF%AA%EF%BF%A7%EF%BF%A4I%0B%EF%BE%85%3Bym%EF%BF%B9O%EF%BE%84%09%EF%BE%BBi_%EF%BE%B0%14%EF%BE%ACth%EF%BF%86%40%EF%BE%8B%EF%BE%AB%EF%BE%A9S%EF%BE%8A%EF%BF%93%EF%BE%95%0B%EF%BE%A7%EF%BF%9E%EF%BF%BC9%EF%BE%B4%EF%BF%A1%EF%BF%97c4%09.%EF%BE%85%0BH%EF%BF%A8%07%1C%EF%BE%A6%7Bz%EF%BF%BE%EF%BE%B8</Value></Oprand><Oprand><Name>__isdisplay__where</Name><Value>%EF%BE%84%EF%BE%8D%EF%BF%87%12Sa%06%EF%BE%A2%EF%BF%8A%06%EF%BF%96j%EF%BF%BF%EF%BE%9A%07%EF%BF%B7%EF%BF%82%11%1A%EF%BE%99%EF%BF%85%EF%BF%8E%EF%BF%AD%2C%26%EF%BF%83%EF%BF%8AR%EF%BF%91b%EF%BE%BA%EF%BF%80+%EF%BF%AF%EF%BE%97T%7C%00E-hZB%2Cs%EF%BF%AF%7D%EF%BE%A1%EF%BE%AD%EF%BE%8Er%7ED%EF%BE%8C7Y%13%1BSk%EF%BE%BB%EF%BE%A6%EF%BF%B7%EF%BE%BF%EF%BF%B4%EF%BF%81%EF%BE%89%27%21%EF%BF%81%EF%BE%87%12%7E%7F%5E%EF%BE%89%EF%BE%BC%EF%BF%AE%EF%BE%A8%EF%BE%90%EF%BF%BD%EF%BE%9D%7E%EF%BF%AA%EF%BF%A7%EF%BF%A4I%0B%EF%BE%85%3Bym%EF%BF%B9O%EF%BE%84%09%EF%BE%BBi_%EF%BE%B0%14%EF%BE%ACth%EF%BF%86%40%EF%BE%8B%EF%BE%AB%EF%BE%A9S%EF%BE%8A%EF%BF%93%EF%BE%95%0B%EF%BE%A7%EF%BF%9E%EF%BF%BC9%EF%BE%B4%EF%BF%A1%EF%BF%97c4%09.%EF%BE%85%0BH%EF%BF%A8%07%1C%EF%BE%A6%7Bz%EF%BF%BE%EF%BE%B8</Value></Oprand><Oprand><Name>appname</Name><Value>PLUSTWO</Value></Oprand><Oprand><Name>__isdisplay__appname</Name><Value>PLUSTWO</Value></Oprand><Oprand><Name>paramdelimiter</Name><Value>||</Value></Oprand><Oprand><Name>__isdisplay__paramdelimiter</Name><Value>||</Value></Oprand><Oprand><Name>paramstring</Name><Value>appHierarchy=PLUSTWO,WOTRACK</Value></Oprand><Oprand><Name>__isdisplay__paramstring</Name><Value>appHierarchy=PLUSTWO,WOTRACK</Value></Oprand><Oprand><Name>usepagebreaks</Name><Value>true</Value></Oprand><Oprand><Name>__isdisplay__usepagebreaks</Name><Value>true</Value></Oprand><Oprand><Name>P_UNIT</Name><Value></Value></Oprand><Oprand><Name>__isdisplay__P_UNIT</Name><Value></Value></Oprand><Oprand><Name>__page</Name><Value>1</Value></Oprand><Oprand><Name>__svg</Name><Value>false</Value></Oprand><Oprand><Name>__page</Name><Value>1</Value></Oprand><Oprand><Name>__taskid</Name><Value>' + postTime + '</Value></Oprand></Operation></GetUpdatedObjects></soap:Body></soap:Envelope>';
            // eslint-disable-next-line max-len
            // const postData = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetUpdatedObjects xmlns="http://schemas.eclipse.org/birt"><Operation><Target><Id>Document</Id><Type>Document</Type></Target><Operator>GetPage</Operator><Oprand><Name>where</Name><Value>%EF%BE%84%EF%BE%8D%EF%BF%87%12Sa%06%EF%BE%A2%EF%BF%8A%06%EF%BF%96j%EF%BF%BF%EF%BE%9A%07%EF%BF%B7%EF%BF%82%11%1A%EF%BE%99%EF%BF%85%EF%BF%8E%EF%BF%AD%2C%26%EF%BF%83%EF%BF%8AR%EF%BF%91b%EF%BE%BA%EF%BF%80+%EF%BF%AF%EF%BE%97T%7C%00E-hZB%2Cs%EF%BF%AF%7D%EF%BE%A1%EF%BE%AD%EF%BE%8Er%7ED%EF%BE%8C7Y%13%1BSk%EF%BE%BB%EF%BE%A6%EF%BF%B7%EF%BE%BF%EF%BF%B4%EF%BF%81%EF%BE%89%27%21%EF%BF%81%EF%BE%87%12%7E%7F%5E%EF%BE%89%EF%BE%BC%EF%BF%AE%EF%BE%A8%EF%BE%90%EF%BF%BD%EF%BE%9D%7E%EF%BF%AA%EF%BF%A7%EF%BF%A4I%0B%EF%BE%85%3Bym%EF%BF%B9O%EF%BE%84%09%EF%BE%BBi_%EF%BE%B0%14%EF%BE%ACth%EF%BF%86%40%EF%BE%8B%EF%BE%AB%EF%BE%A9S%EF%BE%8A%EF%BF%93%EF%BE%95%0B%EF%BE%A7%EF%BF%9E%EF%BF%BC9%EF%BE%B4%EF%BF%A1%EF%BF%97c4%09.%EF%BE%85%0BH%EF%BF%A8%07%1C%EF%BE%A6%7Bz%EF%BF%BE%EF%BE%B8</Value></Oprand><Oprand><Name>__isdisplay__where</Name><Value>%EF%BE%84%EF%BE%8D%EF%BF%87%12Sa%06%EF%BE%A2%EF%BF%8A%06%EF%BF%96j%EF%BF%BF%EF%BE%9A%07%EF%BF%B7%EF%BF%82%11%1A%EF%BE%99%EF%BF%85%EF%BF%8E%EF%BF%AD%2C%26%EF%BF%83%EF%BF%8AR%EF%BF%91b%EF%BE%BA%EF%BF%80+%EF%BF%AF%EF%BE%97T%7C%00E-hZB%2Cs%EF%BF%AF%7D%EF%BE%A1%EF%BE%AD%EF%BE%8Er%7ED%EF%BE%8C7Y%13%1BSk%EF%BE%BB%EF%BE%A6%EF%BF%B7%EF%BE%BF%EF%BF%B4%EF%BF%81%EF%BE%89%27%21%EF%BF%81%EF%BE%87%12%7E%7F%5E%EF%BE%89%EF%BE%BC%EF%BF%AE%EF%BE%A8%EF%BE%90%EF%BF%BD%EF%BE%9D%7E%EF%BF%AA%EF%BF%A7%EF%BF%A4I%0B%EF%BE%85%3Bym%EF%BF%B9O%EF%BE%84%09%EF%BE%BBi_%EF%BE%B0%14%EF%BE%ACth%EF%BF%86%40%EF%BE%8B%EF%BE%AB%EF%BE%A9S%EF%BE%8A%EF%BF%93%EF%BE%95%0B%EF%BE%A7%EF%BF%9E%EF%BF%BC9%EF%BE%B4%EF%BF%A1%EF%BF%97c4%09.%EF%BE%85%0BH%EF%BF%A8%07%1C%EF%BE%A6%7Bz%EF%BF%BE%EF%BE%B8</Value></Oprand><Oprand><Name>appname</Name><Value>PLUSTWO</Value></Oprand><Oprand><Name>__isdisplay__appname</Name><Value>PLUSTWO</Value></Oprand><Oprand><Name>paramdelimiter</Name><Value>||</Value></Oprand><Oprand><Name>__isdisplay__paramdelimiter</Name><Value>||</Value></Oprand><Oprand><Name>paramstring</Name><Value>appHierarchy=PLUSTWO,WOTRACK</Value></Oprand><Oprand><Name>__isdisplay__paramstring</Name><Value>appHierarchy=PLUSTWO,WOTRACK</Value></Oprand><Oprand><Name>usepagebreaks</Name><Value>true</Value></Oprand><Oprand><Name>__isdisplay__usepagebreaks</Name><Value>true</Value></Oprand><Oprand><Name>P_UNIT</Name><Value></Value></Oprand><Oprand><Name>__isdisplay__P_UNIT</Name><Value></Value></Oprand><Oprand><Name>__page</Name><Value>1</Value></Oprand><Oprand><Name>__svg</Name><Value>false</Value></Oprand><Oprand><Name>__page</Name><Value>1</Value></Oprand><Oprand><Name>__taskid</Name><Value>2020-1-10-15-49-47-857</Value></Oprand></Operation></GetUpdatedObjects></soap:Body></soap:Envelope>';
            const postRequest = http.request(options, function(res) {
              const chunks = [];
              res.on('data', function(chunk) {
                chunks.push(chunk);
              });
              res.on('end', function() {
                const body = Buffer.concat(chunks);
                const xml = entities.decode(body.toString());
                parseString(xml, function(err, result) {
                  // eslint-disable-next-line max-len
                  const timeUpdated = result['soapenv:Envelope']['soapenv:Body'][0]['GetUpdatedObjectsResponse'][0]['Update'][0]['UpdateContent'][0]['Content'][0]['div'][0]['table'][0]['tr'][2]['td'][0]['table'][0]['tr'][0]['td'][0]['div'][0]['_'];
                  // eslint-disable-next-line max-len
                  const table = result['soapenv:Envelope']['soapenv:Body'][0]['GetUpdatedObjectsResponse'][0]['Update'][0]['UpdateContent'][0]['Content'][0]['div'][0]['table'][0]['tr'][1]['td'][0]['table'][2]['tr'];
                  const tableHeaders = table[0]['th'];
                  const headers = [];
                  const listNIS = {
                    list: [],
                    updated: moment(timeUpdated, 'DD.MM.YYYY hh:mm:ss'),
                  };
                  for (let i = 0; i < tableHeaders.length; i++) {
                    headers.push(tableHeaders[i]['div'][0]['_']);
                  }
                  for (let i = 1; i < table.length; i++) {
                    const item = {};
                    for (let h = 0; h < headers.length; h++) {
                      const value = table[i]['td'][h]['div'][0];
                      switch (headers[h]) {
                        case 'Workorder No':
                          item.workOrderId = value;
                          break;
                        case 'Status':
                          item.status = value;
                          break;
                        case 'Unit':
                          item.unit = value;
                          break;
                        case 'NIS/Rst Detail':
                          item.NIS = value.includes('NIS');
                          item.plannedNIS = value.includes('NIS') && value.includes('Planned');
                          item.unplannedNIS = value.includes('NIS') && value.includes('Unplanned');
                          item.restricted = !value.includes('NIS');
                          item.detail = value;
                          break;
                        case 'Description':
                          item.description = value;
                          break;
                        case 'Reported Date':
                          item.reportedDate = moment(value, 'DD.MM.YYYY hh:mm:ss').format();
                          break;
                      }
                    }
                    listNIS.list.push(item);
                  }
                  resolve(listNIS);
                });
              });
              res.on('error', function(error) {
                console.error(error);
              });
            });
            postRequest.write(postData);
            postRequest.end();
          }));
        });
        res.on('error', function(error) {
          console.error(error);
        });
      });
      postRequest.write('');
      postRequest.end();
    });
  },
  checkAPI: function(maximoTokens) {
    let status = 'Connection OK';
    const tokens = maximoTokens.tokens;
    return new Promise(function(resolve, reject) {
      if (tokens == undefined) {
        status = 'Invalid Authentication Tokens';
      } else {
        const cookies = 'JSESSIONID=' + tokens.cookies[0].value;
        const options = {
          'method': 'POST',
          'hostname': '192.168.103.11',
          'path': '/maximo/report?__report=Z51_WONTRList.rptdesign&appname=PLUSTWO' +
            '&__requestid=' + tokens.__requestid +
            '&uisessionid=' + tokens.uisessionid +
            '&csrftoken=' + tokens.csrftoken,
          'headers': {
            'request-type': 'SOAP',
            'SOAPAction': '""',
            'Cookie': cookies,
          },
          'maxRedirects': 20,
        };
        const postTime = moment().format('YYYY-M-D-H-m-s-S');
        // eslint-disable-next-line max-len
        const postData = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetUpdatedObjects xmlns="http://schemas.eclipse.org/birt"><Operation><Target><Id>Document</Id><Type>Document</Type></Target><Operator>GetPage</Operator><Oprand><Name>where</Name><Value>%EF%BE%84%EF%BE%8D%EF%BF%87%12Sa%06%EF%BE%A2%EF%BF%8A%06%EF%BF%96j%EF%BF%BF%EF%BE%9A%07%EF%BF%B7%EF%BF%82%11%1A%EF%BE%99%EF%BF%85%EF%BF%8E%EF%BF%AD%2C%26%EF%BF%83%EF%BF%8AR%EF%BF%91b%EF%BE%BA%EF%BF%80+%EF%BF%AF%EF%BE%97T%7C%00E-hZB%2Cs%EF%BF%AF%7D%EF%BE%A1%EF%BE%AD%EF%BE%8Er%7ED%EF%BE%8C7Y%13%1BSk%EF%BE%BB%EF%BE%A6%EF%BF%B7%EF%BE%BF%EF%BF%B4%EF%BF%81%EF%BE%89%27%21%EF%BF%81%EF%BE%87%12%7E%7F%5E%EF%BE%89%EF%BE%BC%EF%BF%AE%EF%BE%A8%EF%BE%90%EF%BF%BD%EF%BE%9D%7E%EF%BF%AA%EF%BF%A7%EF%BF%A4I%0B%EF%BE%85%3Bym%EF%BF%B9O%EF%BE%84%09%EF%BE%BBi_%EF%BE%B0%14%EF%BE%ACth%EF%BF%86%40%EF%BE%8B%EF%BE%AB%EF%BE%A9S%EF%BE%8A%EF%BF%93%EF%BE%95%0B%EF%BE%A7%EF%BF%9E%EF%BF%BC9%EF%BE%B4%EF%BF%A1%EF%BF%97c4%09.%EF%BE%85%0BH%EF%BF%A8%07%1C%EF%BE%A6%7Bz%EF%BF%BE%EF%BE%B8</Value></Oprand><Oprand><Name>__isdisplay__where</Name><Value>%EF%BE%84%EF%BE%8D%EF%BF%87%12Sa%06%EF%BE%A2%EF%BF%8A%06%EF%BF%96j%EF%BF%BF%EF%BE%9A%07%EF%BF%B7%EF%BF%82%11%1A%EF%BE%99%EF%BF%85%EF%BF%8E%EF%BF%AD%2C%26%EF%BF%83%EF%BF%8AR%EF%BF%91b%EF%BE%BA%EF%BF%80+%EF%BF%AF%EF%BE%97T%7C%00E-hZB%2Cs%EF%BF%AF%7D%EF%BE%A1%EF%BE%AD%EF%BE%8Er%7ED%EF%BE%8C7Y%13%1BSk%EF%BE%BB%EF%BE%A6%EF%BF%B7%EF%BE%BF%EF%BF%B4%EF%BF%81%EF%BE%89%27%21%EF%BF%81%EF%BE%87%12%7E%7F%5E%EF%BE%89%EF%BE%BC%EF%BF%AE%EF%BE%A8%EF%BE%90%EF%BF%BD%EF%BE%9D%7E%EF%BF%AA%EF%BF%A7%EF%BF%A4I%0B%EF%BE%85%3Bym%EF%BF%B9O%EF%BE%84%09%EF%BE%BBi_%EF%BE%B0%14%EF%BE%ACth%EF%BF%86%40%EF%BE%8B%EF%BE%AB%EF%BE%A9S%EF%BE%8A%EF%BF%93%EF%BE%95%0B%EF%BE%A7%EF%BF%9E%EF%BF%BC9%EF%BE%B4%EF%BF%A1%EF%BF%97c4%09.%EF%BE%85%0BH%EF%BF%A8%07%1C%EF%BE%A6%7Bz%EF%BF%BE%EF%BE%B8</Value></Oprand><Oprand><Name>appname</Name><Value>PLUSTWO</Value></Oprand><Oprand><Name>__isdisplay__appname</Name><Value>PLUSTWO</Value></Oprand><Oprand><Name>paramdelimiter</Name><Value>||</Value></Oprand><Oprand><Name>__isdisplay__paramdelimiter</Name><Value>||</Value></Oprand><Oprand><Name>paramstring</Name><Value>appHierarchy=PLUSTWO,WOTRACK</Value></Oprand><Oprand><Name>__isdisplay__paramstring</Name><Value>appHierarchy=PLUSTWO,WOTRACK</Value></Oprand><Oprand><Name>usepagebreaks</Name><Value>true</Value></Oprand><Oprand><Name>__isdisplay__usepagebreaks</Name><Value>true</Value></Oprand><Oprand><Name>P_UNIT</Name><Value></Value></Oprand><Oprand><Name>__isdisplay__P_UNIT</Name><Value></Value></Oprand><Oprand><Name>__page</Name><Value>1</Value></Oprand><Oprand><Name>__svg</Name><Value>false</Value></Oprand><Oprand><Name>__page</Name><Value>1</Value></Oprand><Oprand><Name>__taskid</Name><Value>' + postTime + '</Value></Oprand></Operation></GetUpdatedObjects></soap:Body></soap:Envelope>';
        const postRequest = http.request(options, function(res) {
          res.on('end', function() {
            if (res.statusCode !== 200) {
              status = 'Maximo Connection Error';
            }
          });
          res.on('error', function(error) {
            console.error(error);
          });
        });
        postRequest.write(postData);
        postRequest.end();
      }
      resolve(status);
    });
  },
};

