/* eslint-disable no-undef */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const puppeteer = require('puppeteer');
// ======Authentication credentials=======
const credentials = require('../credentials');

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
      const tokenURL = 'https://gis.kiwirail.co.nz/arcgis/rest/services/External/gevisOpData/MapServer/export';
      const args = ['--enable-features=NetworkService', '--disable-setuid-sandbox', '--no-sandbox'];
      const options = {
        args,
        headless: true,
        ignoreHTTPSErrors: true,
      };
      browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      // disable cache to ensure fresh log in each time
      await page.setCacheEnabled(false);
      // navigate to GeVis page
      await page.goto('https://gis.kiwirail.co.nz/maps/?viewer=gevis', { waitUntil: 'networkidle0' });
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
          const url = interceptedRequest.url();
          const stringarray = url.split('&');
          token = stringarray[0].split('=')[1];
          // format with time retrieved
          thisgeVisToken = [token, moment()];
          return thisgeVisToken;
        } else {
          interceptedRequest.continue();
        }
      });
      await page.waitForRequest('https://gis.kiwirail.co.nz/maps/Resources/Compiled/Alert.js');
      // code to close browser on timeout
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000)).catch((error) => {
        browser.close();
        console.log(error);
      });
      await browser.close();
      return thisgeVisToken;
    })().catch((error) => {
      browser.close();
      console.log(error);
    }).finally(function () {
      browser.close();
    });
  },
  /**
   * uses pupperteer to log into Maximo and retrieve the tokens required to load the NIS list
   */
  getMaximoTokens: async function getMaximoTokens() {
    return (async () => {
      const tokens = {
        __requestid: '',
        uisessionid: '',
        csrftoken: '',
        cookies: {},
      };
      const args = ['--enable-features=NetworkService'];
      const options = {
        args,
        headless: true,
        ignoreHTTPSErrors: false,
      };
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
      // code to close browser on timeout
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)).catch((error) => {
        browser.close();
        console.log(error);
      });
      await page.goto('http://192.168.103.11/maximo/webclient/login/login.jsp');
      await page.waitForSelector('#username');
      await page.type('#username', credentials.Maximo.username),
      await page.type('#password', credentials.Maximo.password),
      await page.click('#loginbutton'),
      // eslint-disable-next-line max-len
      await page.waitForRequest('http://192.168.103.11/maximo/webclient/skins/skins-20161213-2009/tivoli13/images/btn_nextpage.gif');
      await page.goto('http://192.168.103.11/maximo/ui/?event=loadapp&value=plustwo');
      await page.evaluate(() => {
        console.log(sendEvent('click', 'toolbar2_tbs_1_tbcb_0_action-img', null));
      });
      await page.waitForSelector('#menu0');
      await page.evaluate(() => {
        console.log(sendEvent('click', 'mainrec_menus', 'RUNREPORTS_OPTION'));
      });
      await page.waitForSelector('#reportFilesPLUSTWO-dialog_inner');
      await page.evaluate(() => {
        console.log(sendEvent('click', 'ma6b93efe_tdrow_[C:0]_ttxt-lb[R:29]', null));
      });
      await page.waitForSelector('#mefedc979-pb');
      await page.evaluate(() => {
        console.log(sendEvent('click', 'mefedc979-pb', ''));
      });
      // eslint-disable-next-line max-len
      const newTab = await browser.waitForTarget((target) => target.url().startsWith('http://192.168.103.11/maximo/report'));
      const newPage = await newTab.page();
      const reportURL = await newPage.url();
      const stringarray = reportURL.split('?');
      const params = stringarray[1].split('&');
      tokens.__requestid = params[2].split('=')[1];
      tokens.uisessionid = params[3].split('=')[1];
      tokens.csrftoken = params[4].split('=')[1];
      tokens.cookies = await newPage.cookies();
      await page.waitFor(1000);
      await browser.close();
      return tokens;
    })().catch((error) => {
      console.log(error);
      browser.close();
    });
  },
};
