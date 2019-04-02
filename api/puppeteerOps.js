let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const puppeteer = require('puppeteer');
// ======Authentication credentials=======
let credentials = require('../credentials');

// browser variable
let browser;

module.exports = {
  /**
   * uses pupperteer to log into mobile GeVis and retrieve an authentication token
   */
  getGeVisToken: async function getGeVisToken() {
    return (async () => {
      let token;
      let thisgeVisToken;
      // URL to scrape API token from
      let tokenURL = 'https://gis.kiwirail.co.nz/arcgis/rest/services/External/gevisOpData/MapServer/export';
      const args = ['--enable-features=NetworkService', '--disable-setuid-sandbox', '--no-sandbox'];
      const options = {
        args,
        headless: false,
        ignoreHTTPSErrors: true,
      };
      browser = await puppeteer.launch(options);
      let page = await browser.newPage();
      // disable cache to ensure fresh log in each time
      await page.setCacheEnabled(false);
      // navigate to GeVis page
      await page.goto('https://gis.kiwirail.co.nz/maps/?viewer=gevis', {waitUntil: 'networkidle0'});
      await page.click('[value="External Identity"]');
      await page.waitForSelector('#UserName');
      await page.type('#UserName', credentials.GeVis.username);
      await page.type('#Password', credentials.GeVis.password);
      await page.click('[value="Sign In"]');
      await page.waitForNavigation();
      await page.setRequestInterception(true);
      page.on('request', (interceptedRequest) => {
        // abort some requests that neddlessly eat bandwidth and time
        if (interceptedRequest.url().endsWith('.png')
          || interceptedRequest.url().endsWith('.jpg')
          || interceptedRequest.url().endsWith('.gif')
          || interceptedRequest.url().endsWith('.css')) {
          interceptedRequest.abort();
        } else if (interceptedRequest.url().startsWith(tokenURL)) {
          // get token from URL string
          let url = interceptedRequest.url();
          let stringarray = url.split('&');
          token = stringarray[0].split('=')[1];
          // format with time retrieved
          thisgeVisToken = [token, moment()];
          return thisgeVisToken;
        } else {
          interceptedRequest.continue();
        }
      });
      await page.waitForRequest('https://gis.kiwirail.co.nz/maps/Resources/Compiled/Alert.js');
      // // code to close browser on timeout
      // new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000)).catch((error) => {
      //   browser.close();
      //   console.log(error);
      // });
      await browser.close();
      return thisgeVisToken;
    })().catch((error) => {
      browser.close();
      console.log(error);
    });
  },
};
