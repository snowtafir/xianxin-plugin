import fs from 'node:fs/promises';
import yaml from 'yaml';

let yunzaiName = null;
let puppeteerRendererClass = null;
let puppeteerInst = null;

/**通过判断Yunzai衍生版本名称，动态导入渲染器 */
async function getPuppeteer() {
  if (!yunzaiName) {
    yunzaiName = await fs.readFile('./package.json')
      .then(data => JSON.parse(data))
      .then(pmcfg => pmcfg?.name || 'Yunzai-Bot')
      .catch(() => 'Yunzai-Bot');
  }

  if (yunzaiName === 'miao-yunzai' || yunzaiName === 'trss-yunzai') {
    puppeteerRendererClass = puppeteerRendererClass || (await import('../../../renderers/puppeteer/lib/puppeteer.js')).default;
    puppeteerInst = puppeteerInst || new puppeteerRendererClass(getYunzaiRendererCfg());
    return puppeteerInst;
  }

  return (await import('../../../lib/puppeteer/puppeteer.js')).default;
}

function getYunzaiRendererCfg() {
  let rendererCfg;
  try {
    const configFile = './renderers/puppeteer/config.yaml';
    rendererCfg = yaml.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (e) {
    rendererCfg = getTempDefaultRendererCfg();
  }
  return rendererCfg;
}

function getTempDefaultRendererCfg() {
  return {
    headless: 'new',
    args: [
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote'
    ]
  };
}

export { getPuppeteer };