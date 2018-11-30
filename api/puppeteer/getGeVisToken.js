const puppeteer = require('puppeteer');
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports.getGeVisToken = getGeVisToken;
/**
 *
 * @return {array} valid GeVis Token, timestamp retrieved
 */
async function getGeVisToken() {
      (async () => {
      let token;
      let t0 = Date.now();
      const args = ['--enable-features=NetworkService'];
      const options = {
        args,
        headless: false,
        ignoreHTTPSErrors: false,
      };
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      // await page.waitFor(5000)
      await page.setCacheEnabled(false);
      await page.goto('https://gis.kiwirail.co.nz/maps/?viewer=gevis', {waitUntil: 'networkidle0'});
      await page.click('[value="External Identity"]'),
      await page.waitForSelector('#UserName');
      await page.type('#UserName', 'transdevnz'),
      await page.type('#Password', 't26R!9x4fZ'),
      await page.click('[value="Sign In"]'),
      await page.waitForNavigation();
      await page.setRequestInterception(true);
      // await page.waitFor(20000);
      page.on('request', (interceptedRequest) => {
        if (interceptedRequest.url().startsWith('https://gis.kiwirail.co.nz/arcgis/rest/services/External/gevisOpData/MapServer/export')) {
          let url = interceptedRequest.url();
          let stringarray = url.split('&');
          token = stringarray[0].split('=')[1];
          let t1 = Date.now();
          console.log(token);
          console.log('Call to doSomething took ' + (t1 - t0) + ' milliseconds.');
          browser.close();
          return ([token, moment()]);
        } else {
          interceptedRequest.continue();
        }
      });
    })();
  }
