import lodash from 'lodash';
import fetch from "node-fetch";
import fs from "node:fs";
import { promisify } from 'node:util';
import YAML from "yaml";
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import xxCfg from "./../model/xxCfg.js";
import { gen_buvid_fp } from "./BuvidFp.js";

const _path = process.cwd().replace(/\\/g, "/");

const API = {
    //获取动态资源列表 wbi/无wbi parama = { host_mid: uid, timezone_offset: -480, platform: 'web', features: 'itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote', web_location: "333.999", ...getDmImg(), "x-bili-device-req-json": { "platform": "web", "device": "pc" }, "x-bili-web-req-json": { "spm_id": "333.999" }, w_rid, wts }
    biliDynamicInfoList: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space`,

    //获取关注数与粉丝数 parama = { vmid: uid }
    biliUpFollowFans: `https://api.bilibili.com/x/relation/stat`,

    //通过uid获取up更多详情 parama = { mid: uid, jsonp: jsonp }
    biliSpaceUserInfo: `https://api.bilibili.com/x/space/acc/info`,

    //parama = { mid: uid, jsonp: jsonp }
    biliSpaceUserInfo_wbi: `https://api.bilibili.com/x/space/wbi/acc/info`,

    //通过关键词${upKeyword}搜索up parama = { keyword: 'upKeyword', page: 1, search_type: 'bili_user', order: 'totalrank', pagesize: 5  }
    biliSearchUp: `https://api.bilibili.com/x/web-interface/search/type`,

    bili_live_status: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
    biliCard: "https://api.bilibili.com/x/web-interface/card",
    biliStat: "https://api.bilibili.com/x/relation/stat",
    biliLiveUserInfo: "https://api.live.bilibili.com/live_user/v1/Master/info",
    biliOpusDetail: "https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail",
};

/**统一设定请求头 header */
const BILIBILI_HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-type': 'application/json;charset=UTF-8',
    Cookie: '',
    'pragma': "no-cache",
    "Cache-control": "max-age=0",
    'DNT': 1,
    'Sec-GPC': 1,
    //'sec-ch-ua': '"Microsoft Edge";v="114", "Chromium";v="114", "Not-A.Brand";v="24"',
    'sec-ch-ua-platform': '',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-User': '?0',
    'TE': 'trailers',
    "Upgrade-insecure-requests": 1,
    'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'
    //'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36 115Browser/9.1.1',
}
//Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36
//'Mozilla/5.0 (X11; Linux x86_64; rv:100.0) Gecko/20100101 Firefox/100.0'
// Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36 115Browser/9.1.1

const BIlIBILI_LOGIN_HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': 1,
    'Sec-GPC': 1,
    'Upgrade-Insecure-Requests': 1,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'TE': 'trailers',
}

/**申请登陆二维码(web端) */
async function applyQRCode(e) {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header'
    const response = await fetch(url, {
        method: "GET",
        headers: lodash.merge(BIlIBILI_LOGIN_HEADERS, { 'user-agent': BILIBILI_HEADERS['User-agent'] }, { 'Host': 'passport.bilibili.com', }),
        redirect: "follow",
    });
    const res = await response.json();

    if (res.code === 0) {
        const qrcodeKey = res.data.qrcode_key;
        const qrcodeUrl = res.data.url;
        let rendata = {
            data: { url: `${qrcodeUrl}` },
            pluResPath: _path + "/plugins/trss-xianxin-plugin/resources/",
            tplFile: "./plugins/trss-xianxin-plugin/resources/html/qrCode/qrCode.html",
            saveId: `qrCode`,
        }
        const qrCodeImage = await puppeteer.screenshot("html/qrCode", rendata, { e, scale: 1.4 });

        let msg = [];
        msg.push(qrCodeImage);
        e.reply('请在3分钟内扫码以完成B站登陆绑定');
        e.reply(msg);

        return qrcodeKey;
    } else {
        e.reply(`获取B站登录二维码失败: ${data.message}`);
        throw new Error(`获取B站登录二维码失败: ${data.message}`);
    }
}

/**处理扫码结果 */
async function pollQRCode(e, token) {
    const url = `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${token}&source=main-fe-header`;
    const response = await fetch(url, {
        method: "GET",
        headers: lodash.merge(BIlIBILI_LOGIN_HEADERS, { 'User-agent': BILIBILI_HEADERS['User-agent'] }, { 'Host': 'passport.bilibili.com', }),
        redirect: "follow",
    });
    const data = await response.json();

    if (data.code === 0) {
        if (data.data.code === 0) {
            // 登录成功，获取 cookie
            const LoginCookie = response.headers.get('set-cookie');
            e.reply(`~B站登陆成功~`);
            return LoginCookie;
        } else if (data.data.code === 86101) {
            // 未扫码
            // 继续轮询
            await new Promise((resolve) => setTimeout(resolve, 2000));
            (logger ?? Bot.logger)?.mark(`trss-xianxin插件：扫码B站登录：未扫码，轮询中...`);
            return pollQRCode(e, token);
        } else if (data.data.code === 86090) {
            // 已扫码未确认
            // 继续轮询
            await new Promise((resolve) => setTimeout(resolve, 2000))
            return pollQRCode(e, token);
        } else if (data.data.code === 86038) {
            // 二维码已失效
            e.reply('B站登陆二维码已失效');
            return null;
        } else {
            e.reply('处理扫码结果出错');
            throw new Error(`处理扫码结果出错: ${data?.data?.message}`);
        }
    } else {
        e.reply('处理扫码结果出错');
        throw new Error(`处理扫码结果出错: ${data?.message}`);
    }
}
/**保存扫码登录的loginCK*/
async function saveLoginCK(e, biliLoginCk) {
    if ((biliLoginCk !== null) || (biliLoginCk !== undefined) || (biliLoginCk.length !== 0) || (biliLoginCk !== '')) {
        const LoginCkKey = "Yz:xianxin:bilibili:biliLoginCookie";
        redis.set(LoginCkKey, `${biliLoginCk}`, { EX: 3600 * 24 * 360 });
    } else if (biliLoginCk === null) {
        e.reply("扫码超时");
    }
}

/**读取扫码登陆后缓存的cookie*/
async function readLoginCk() {
    let tempCk = '';
    let ckKey = "Yz:xianxin:bilibili:biliLoginCookie";
    tempCk = await redis.get(ckKey);

    if ((tempCk !== null) || (tempCk !== undefined) || (tempCk.length !== 0) || (tempCk !== '')) {
        return tempCk;
    } else {
        return '';
    }
}

/**查看app扫码登陆获取的ck的有效状态*/
async function checkLogin(e) {
    const LoginCookie = await readLoginCk();
    const res = await fetch("https://api.bilibili.com/x/web-interface/nav", {
        method: "GET",
        headers: lodash.merge(BIlIBILI_LOGIN_HEADERS, { 'User-agent': BIlIBILI_LOGIN_HEADERS['User-agent'] }, { "Cookie": `${LoginCookie}`, }),
        redirect: "follow",
    });
    const resData = await res.json();
    Bot.logger?.mark(`B站动态请求code:${JSON.stringify(resData)}`);
    if (resData.code === 0) {
        let uname = resData.data?.uname;
        let mid = resData.data?.mid;
        let money = resData.data?.money;
        let level_info = resData.data?.level_info;
        let current_level = level_info?.current_level;
        let current_exp = level_info?.current_exp;
        let next_exp = level_info?.next_exp;
        e.reply(`~B站账号已登陆~\n昵称：${uname}\nuid：${mid}\n硬币：${money}\n经验等级：${current_level}\n当前经验值exp：${current_exp}\n下一等级所需exp：${next_exp}`);
    } else {
        e.reply(`~B站账号未登陆~`);
    }
}

/**退出B站账号登录，将会删除redis缓存的LoginCK，并在服务器注销该登录 Token (SESSDATA)*/
async function exitBiliLogin(e) {
    let exitCk = readLoginCk();
    let SESSDATA = readSavedCookieItems(exitCk, ['SESSDATA']);
    let biliCSRF = readSavedCookieItems(exitCk, ['bili_jct']);
    let DedeUserID = readSavedCookieItems(exitCk, ['DedeUserID']);
    
    if (lodash.trim(SESSDATA).length != 0 && lodash.trim(biliCSRF).length != 0 && lodash.trim(DedeUserID).length != 0) {
        const data = {
            "biliCSRF": biliCSRF,
        };
        try {
            const response = await fetch('https://passport.bilibili.com/login/exit/v2', {
                method: 'POST',
                headers: {
                    'Host': 'passport.bilibili.com',
                    'Cookie': `${exitCk}`,
                    'Content-type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: new URLSearchParams(data),
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                e.reply("当前缓存的B站登录CK早已失效！");
                return; // 确保在这里结束处理流程
            }

            const responseData = await response.json(); // 只有在不是 text/html 的情况下才调用 json()
            console.log('Response Data:', responseData); // 添加日志

            if (responseData.code === 0) {
                e.reply("当前缓存的B站登录CK已在服务器注销~");
                const LoginCkKey = "Yz:xianxin:bilibili:biliLoginCookie";
                let loginCK = "";
                await redis.set(LoginCkKey, loginCK, { EX: 3600 * 24 * 180 });
                e.reply(`登陆的B站ck并已删除~`);
            } else if (responseData.code === 2202) {
                e.reply("csrf 请求非法，退出登录请求出错");
            } else {
                e.reply("当前缓存的B站登录CK早已失效！");
            }
        } catch (error) {
            console.error('Error during Bili login exit:', error);
            e.reply("退出登录请求出错，请稍后再试");
        }
    } else {
        e.reply("当前无可用的B站登录CK可退出登录");
    }
}

/**
 *综合读取、筛选 传入的或本地或redis存储的cookie的item
 * @param {string} mark 读取存储的CK类型，'localCK' 'tempCK' 'loginCK' 或传入值 'xxx'并进行筛选
 * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid']
 * @returns {string} 
 **/
async function readSavedCookieItems(mark, items) {
    let ckString = '';
    if (mark == 'localCK') {
        ckString = await readLocalBiliCk();
    } else if (mark == 'tempCK') {
        ckString = await readTempCk();
    } else if (mark == 'loginCK') {
        ckString = await readLoginCk();
    } else {
        ckString = mark;
    }
    let Bck = lodash.trim(ckString);
    if ((Bck !== null) && (Bck !== undefined) && (Bck.length !== 0) && (Bck !== '')) {
        if (items[0] == 'all') {
            return Bck;
        } else {
            let Ck = String(Bck)
                .trim()
                .match(/(\w+)=([^;|,]+)/g) /**使用正则表达式 /(\w+)=([^;]+);/g 来匹配形式为 a=b 的内容,使用 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符*/
                ?.map(match => match.split('='))
                .filter(([key, value]) => items.includes(key) && value !== '') /**过滤并仅保留键值对中值为非空的情况*/
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            return Ck
        }
    } else {
        return '';
    }
}
//取反读取ck
async function readSavedCookieOtherItems(mark, items) {
    let ckString = '';
    if (mark == 'localCK') {
        ckString = await readLocalBiliCk();
    } else if (mark == 'tempCK') {
        ckString = await readTempCk();
    } else if (mark == 'loginCK') {
        ckString = await readLoginCk();
    } else {
        ckString = mark;
    }
    let Bck = lodash.trim(ckString);
    if ((Bck !== null) && (Bck !== undefined) && (Bck.length !== 0) && (Bck !== '')) {
        if (items[0] == 'all') {
            return Bck;
        } else {
            let Ck = String(Bck)
                .trim()
                .match(/(\w+)=([^;|,]+)/g) /**使用正则表达式 /(\w+)=([^;]+);/g 来匹配形式为 a=b 的内容,使用 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符*/
                ?.map(match => match.split('='))
                .filter(([key, value]) => !items.includes(key) && value !== '') /**过滤并仅保留键值对中值为非空的情况*/
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            return Ck
        }
    } else {
        return '';
    }
}

/** 读取手动绑定的B站ck */
async function readLocalBiliCk() {
    let dir = `./data/BilibiliCookie/`
    let Bck = []

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }) // 创建目录，包括父目录
    }
    let files = fs.readdirSync(dir).filter(file => file.endsWith('.yaml'))

    const readFile = promisify(fs.readFile)

    let promises = []

    files.forEach((v) => promises.push(readFile(`${dir}${v}`, 'utf8')))
    const res = await Promise.all(promises)
    res.forEach((v, index) => {
        let tmp = YAML.parse(v)
        Bck.push(tmp)
    })
    return Bck
}

/** 覆盖保存手动获取绑定的B站ck */
async function saveLocalBiliCk(data) {
    let dir = `./data/BilibiliCookie/`
    let file = dir + `bili_Ck.yaml`
    let addData = String(data).replace(/\s/g, '').trim();
    if (lodash.isEmpty(addData)) {
        fs.existsSync(file) && fs.unlinkSync(file)
    } else {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }) // 创建目录，包括父目录
        }
        let yaml = YAML.stringify(addData);
        fs.writeFileSync(file, yaml, 'utf8')
    }
}

/**读取缓存的tempCK*/
async function readTempCk() {
    let tempCk = '';
    const ckKey = "Yz:xianxin:bilibili:biliTempCookie";
    tempCk = await redis.get(ckKey);
    return tempCk;
}

/**保存tempCK*/
async function saveTempCk(newTempCk) {
    const ckKey = "Yz:xianxin:bilibili:biliTempCookie";
    await redis.set(ckKey, newTempCk, { EX: 3600 * 24 * 180 });
}

/**请求参数POST接口(ExClimbWuzhi)过校验*/
async function payloadData(cookie) {
    let payloadData = {
        "3064": 1, // ptype, mobile => 2, others => 1
        "5062": `${Date.now()}`, // timestamp
        "03bf": "https://www.bilibili.com/", // url accessed
        "39c8": "333.999.fp.risk", // spm_id,
        "34f1": "", // target_url, default empty now
        "d402": "", // screenx, default empty
        "654a": "", // screeny, default empty
        "6e7c": "1112x1000", // browser_resolution, window.innerWidth || document.body && document.body.clientWidth + "x" + window.innerHeight || document.body && document.body.clientHeight
        "3c43": { // 3c43 => msg
            "2673": 0, // hasLiedResolution, window.screen.width < window.screen.availWidth || window.screen.height < window.screen.availHeight
            "5766": 24, // colorDepth, window.screen.colorDepth
            "6527": 0, // addBehavior, !!window.HTMLElement.prototype.addBehavior, html5 api
            "7003": 1, // indexedDb, !!window.indexedDB, html5 api
            "807e": 1, // cookieEnabled, navigator.cookieEnabled
            "b8ce": BILIBILI_HEADERS['user-agent'], // ua
            "641c": 0, // webdriver, navigator.webdriver, like Selenium
            "07a4": "zh-CN", // language
            "1c57": 8, // deviceMemory in GB, navigator.deviceMemory
            "0bd0": 2, // hardwareConcurrency, navigator.hardwareConcurrency
            "748e": [
                1818, // window.screen.width
                1080  // window.screen.height
            ], // screenResolution
            "d61f": [
                1918, // window.screen.availWidth
                1080  // window.screen.availHeight
            ], // availableScreenResolution
            "fc9d": -480, // timezoneOffset, (new Date).getTimezoneOffset()
            "6aa9": "Asia/Hong_Kong", //Intl.DateTimeFormat().resolvedOptions().timeZone, // timezone, (new window.Intl.DateTimeFormat).resolvedOptions().timeZone
            "75b8": 1, // sessionStorage, window.sessionStorage, html5 api
            "3b21": 1, // localStorage, window.localStorage, html5 api
            "8a1c": 1, // openDatabase, window.openDatabase, html5 api
            "d52f": "not available", // cpuClass, navigator.cpuClass
            "adca": BILIBILI_HEADERS['User-agent'].includes('Windows') ? 'Win32' : 'Linux', // platform, navigator.platform
            "80c9": [
                [
                    "Chromium PDF Plugin",
                    "Portable Document Format",
                    [["application/x-google-chrome-pdf", "pdf"]],
                ],
                ["Chromium PDF Viewer", "", [["application/pdf", "pdf"]]],
            ], // plugins
            "13ab": "ZgAAAABJRU5ErkJggg==", // canvas fingerprint
            "bfe9": "BAWgcAVlo/OQ0HcCCjA/8D8Y76prQ7F9EAAAAASUVORK5CYII=", // webgl_str
            "a3c1":
                [
                    "extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_texture_compression_bptc;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;EXT_sRGB;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linear;OES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_color_buffer_float;WEBGL_compressed_texture_astc;WEBGL_compressed_texture_etc;WEBGL_compressed_texture_etc1;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_multi_draw",
                    "webgl aliased line width range:[1, 1]",
                    "webgl aliased point size range:[1, 1023]",
                    "webgl alpha bits:8",
                    "webgl antialiasing:yes",
                    "webgl blue bits:8",
                    "webgl depth bits:24",
                    "webgl green bits:8",
                    "webgl max anisotropy:16",
                    "webgl max combined texture image units:64",
                    "webgl max cube map texture size:16384",
                    "webgl max fragment uniform vectors:4096",
                    "webgl max render buffer size:8192",
                    "webgl max texture image units:32",
                    "webgl max texture size:8192",
                    "webgl max varying vectors:31",
                    "webgl max vertex attribs:16",
                    "webgl max vertex texture image units:32",
                    "webgl max vertex uniform vectors:4096",
                    "webgl max viewport dims:[8192, 8192]",
                    "webgl red bits:8",
                    "webgl renderer:WebKit WebGL",
                    "webgl shading language version:WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)",
                    "webgl stencil bits:0",
                    "webgl vendor:WebKit",
                    "webgl version:WebGL 1.0 (OpenGL ES 2.0 Chromium)",
                    "webgl unmasked vendor:Google Inc.",
                    "webgl unmasked renderer:ANGLE (NVIDIA GeForce 405   Direct3D9Ex vs_3_0 ps_3_0)",
                    "webgl vertex shader high float precision:23",
                    "webgl vertex shader high float precision rangeMin:127",
                    "webgl vertex shader high float precision rangeMax:127",
                    "webgl vertex shader medium float precision:10",
                    "webgl vertex shader medium float precision rangeMin:15",
                    "webgl vertex shader medium float precision rangeMax:15",
                    "webgl vertex shader low float precision:10",
                    "webgl vertex shader low float precision rangeMin:15",
                    "webgl vertex shader low float precision rangeMax:15",
                    "webgl fragment shader high float precision:23",
                    "webgl fragment shader high float precision rangeMin:127",
                    "webgl fragment shader high float precision rangeMax:127",
                    "webgl fragment shader medium float precision:10",
                    "webgl fragment shader medium float precision rangeMin:15",
                    "webgl fragment shader medium float precision rangeMax:15",
                    "webgl fragment shader low float precision:10",
                    "webgl fragment shader low float precision rangeMin:15",
                    "webgl fragment shader low float precision rangeMax:15",
                    "webgl vertex shader high int precision:0",
                    "webgl vertex shader high int precision rangeMin:31",
                    "webgl vertex shader high int precision rangeMax:30",
                    "webgl vertex shader medium int precision:0",
                    "webgl vertex shader medium int precision rangeMin:15",
                    "webgl vertex shader medium int precision rangeMax:14",
                    "webgl vertex shader low int precision:0",
                    "webgl vertex shader low int precision rangeMin:15",
                    "webgl vertex shader low int precision rangeMax:14",
                    "webgl fragment shader high int precision:0",
                    "webgl fragment shader high int precision rangeMin:31",
                    "webgl fragment shader high int precision rangeMax:30",
                    "webgl fragment shader medium int precision:0",
                    "webgl fragment shader medium int precision rangeMin:15",
                    "webgl fragment shader medium int precision rangeMax:14",
                    "webgl fragment shader low int precision:0",
                    "webgl fragment shader low int precision rangeMin:15",
                    "webgl fragment shader low int precision rangeMax:14",
                ], // webgl_params, cab be set to [] if webgl is not supported
            "6bc5": "Google Inc.~ANGLE (NVIDIA GeForce 405   Direct3D9Ex vs_3_0 ps_3_0)", // webglVendorAndRenderer
            "ed31": 0, // hasLiedLanguages
            "72bd": 0, // hasLiedOs
            "097b": 0, // hasLiedBrowser
            "52cd": [
                0, // void 0 !== navigator.maxTouchPoints ? t = navigator.maxTouchPoints : void 0 !== navigator.msMaxTouchPoints && (t = navigator.msMaxTouchPoints);
                0, // document.createEvent("TouchEvent"), if succeed 1 else 0
                0 // "ontouchstart" in window ? 1 : 0
            ], // touch support
            "a658": [
                "Arial",
                "Arial Black",
                "Arial Narrow",
                "Arial Unicode MS",
                "Consolas",
                "Helvetica",
                "Lucida Console",
                "Lucida Sans",
                "Lucida Sans Unicode",
                "Microsoft Sans Serif",
                "Monaco",
                "MS Outlook",
                "MS Sans Serif",
                "MS Serif",
                "Tahoma",
                "Times",
                "Times New Roman",
                "Verdana",
            ], // font details. see https://github.com/fingerprintjs/fingerprintjs for implementation details
            "d02f": "124.04347527516074" // audio fingerprint. see https://github.com/fingerprintjs/fingerprintjs for implementation details
        },
        "54ef": '{"in_new_ab":true,"ab_version":{"waterfall_article":"SHOW"},"ab_split_num":{"waterfall_article":0}}', // abtest info, embedded in html
        "8b94": "", // refer_url, document.referrer ? encodeURIComponent(document.referrer).substr(0, 1e3) : ""
        "df35": (await readSavedCookieItems(cookie, ['_uuid'])), // _uuid, set from cookie, generated by client side(algorithm remains unknown)
        "07a4": "zh-CN", // language
        "5f45": null, // laboratory, set from cookie, null if empty, source remains unknown
        "db46": 0 // is_selfdef, default 0
    };
    const pay = {
        "3064": 1, // ptype, mobile => 2, others => 1
        "5062": `${Date.now()}`, // timestamp
        "03bf": "https://www.bilibili.com/", // url accessed
        "39c8": "333.999.fp.risk",
        "34f1": "", // target_url, default empty now
        "d402": "", // screenx, default empty
        "654a": "", // screeny, default empty
        "6e7c": "878x1066",// browser_resolution, window.innerWidth || document.body && document.body.clientWidth + "x" + window.innerHeight || document.body && document.body.clientHeight
        "3c43": {// 3c43 => msg
            "2673": 0,// hasLiedResolution, window.screen.width < window.screen.availWidth || window.screen.height < window.screen.availHeight
            "5766": 24, // colorDepth, window.screen.colorDepth
            "6527": 0,// addBehavior, !!window.HTMLElement.prototype.addBehavior, html5 api
            "7003": 1,// indexedDb, !!window.indexedDB, html5 api
            "807e": 1,// cookieEnabled, navigator.cookieEnabled
            "b8ce": BILIBILI_HEADERS['user-agent'], // ua "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
            "641c": 0,
            "07a4": "zh-CN",
            "1c57": "not available",
            "0bd0": 16,
            "748e": [1920, 1200],
            "d61f": [1920, 1152],
            "fc9d": -480,
            "6aa9": "Asia/Shanghai",
            "75b8": 1,
            "3b21": 1,
            "8a1c": 0,
            "d52f": "not available",
            "adca": BILIBILI_HEADERS['User-agent'].includes('Windows') ? 'Win32' : 'Linux', // platform, navigator.platform
            "80c9": [
                ["PDF Viewer", "Portable Document Format", [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]],
                ["Chrome PDF Viewer", "Portable Document Format", [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]],
                ["Chromium PDF Viewer", "Portable Document Format", [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]],
                ["Microsoft Edge PDF Viewer", "Portable Document Format", [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]],
                ["WebKit built-in PDF", "Portable Document Format", [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]]
            ],
            "13ab": "f3YAAAAASUVORK5CYII=",
            "bfe9": "kABYpRAGAVYzWJooB9Bf4P+UortSvxRY0AAAAASUVORK5CYII=",
            "a3c1": [
                "extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_sRGB;EXT_texture_compression_bptc;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linear;OES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_color_buffer_float;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_debug_shaders;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_provoking_vertex",
                "webgl aliased line width range:[1, 1]",
                "webgl aliased point size range:[1, 1024]",
                "webgl alpha bits:8", "webgl antialiasing:yes",
                "webgl blue bits:8",
                "webgl depth bits:24",
                "webgl green bits:8",
                "webgl max anisotropy:16",
                "webgl max combined texture image units:32",
                "webgl max cube map texture size:16384",
                "webgl max fragment uniform vectors:1024",
                "webgl max render buffer size:16384",
                "webgl max texture image units:16",
                "webgl max texture size:16384",
                "webgl max varying vectors:30",
                "webgl max vertex attribs:16",
                "webgl max vertex texture image units:16",
                "webgl max vertex uniform vectors:4096",
                "webgl max viewport dims:[32767, 32767]",
                "webgl red bits:8",
                "webgl renderer:ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar",
                "webgl shading language version:WebGL GLSL ES 1.0",
                "webgl stencil bits:0",
                "webgl vendor:Mozilla",
                "webgl version:WebGL 1.0",
                "webgl unmasked vendor:Google Inc. (Intel)",
                "webgl unmasked renderer:ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar",
                "webgl vertex shader high float precision:23",
                "webgl vertex shader high float precision rangeMin:127",
                "webgl vertex shader high float precision rangeMax:127",
                "webgl vertex shader medium float precision:23",
                "webgl vertex shader medium float precision rangeMin:127",
                "webgl vertex shader medium float precision rangeMax:127",
                "webgl vertex shader low float precision:23",
                "webgl vertex shader low float precision rangeMin:127",
                "webgl vertex shader low float precision rangeMax:127",
                "webgl fragment shader high float precision:23",
                "webgl fragment shader high float precision rangeMin:127",
                "webgl fragment shader high float precision rangeMax:127",
                "webgl fragment shader medium float precision:23",
                "webgl fragment shader medium float precision rangeMin:127",
                "webgl fragment shader medium float precision rangeMax:127",
                "webgl fragment shader low float precision:23",
                "webgl fragment shader low float precision rangeMin:127",
                "webgl fragment shader low float precision rangeMax:127",
                "webgl vertex shader high int precision:0",
                "webgl vertex shader high int precision rangeMin:31",
                "webgl vertex shader high int precision rangeMax:30",
                "webgl vertex shader medium int precision:0",
                "webgl vertex shader medium int precision rangeMin:31",
                "webgl vertex shader medium int precision rangeMax:30",
                "webgl vertex shader low int precision:0",
                "webgl vertex shader low int precision rangeMin:31",
                "webgl vertex shader low int precision rangeMax:30",
                "webgl fragment shader high int precision:0",
                "webgl fragment shader high int precision rangeMin:31",
                "webgl fragment shader high int precision rangeMax:30",
                "webgl fragment shader medium int precision:0",
                "webgl fragment shader medium int precision rangeMin:31",
                "webgl fragment shader medium int precision rangeMax:30",
                "webgl fragment shader low int precision:0",
                "webgl fragment shader low int precision rangeMin:31",
                "webgl fragment shader low int precision rangeMax:30"
            ],
            "6bc5": "Google Inc. (Intel)~ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar",
            "ed31": 0,
            "72bd": 0,
            "097b": 0,
            "52cd": [0, 0, 0],
            "a658": ["Arial", "Arial Black", "Calibri", "Cambria", "Cambria Math", "Comic Sans MS", "Consolas", "Courier", "Courier New", "Georgia", "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode", "Microsoft Sans Serif", "MS Gothic", "MS PGothic", "MS Sans Serif", "MS Serif", "Palatino Linotype", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Light", "Segoe UI Symbol", "Tahoma", "Times", "Times New Roman", "Trebuchet MS", "Verdana", "Wingdings"],
            "d02f": "35.749972093850374"
        },
        "54ef": {
            "in_new_ab ": true,
            "ab_version ": {
                "waterfall_article ": "SHOW "
            },
            "ab_split_num ": {
                "waterfall_article ": 0
            }
        },
        "8b94": "",
        "df35": (await readSavedCookieItems(cookie, ['_uuid'])), // _uuid, set from cookie, generated by client side(algorithm remains unknown)
        "07a4": "zh-CN",
        "5f45": null,
        "db46": 0
    }
    return pay///payloadData;
}
/**请求参数POST接口(ExClimbWuzhi)过校验*/
async function postExClimbWuzhi(cookie) {
    let Data = payloadData(cookie)
    const json_data = {
        payload: JSON.stringify(Data),
    };
    let dataLength = Buffer.byteLength(JSON.stringify(json_data));
    let mergeCookie = { cookie: `${cookie}`, 'content-type': 'application/json', 'charset': 'UTF-8', 'Content-Length': `${dataLength}` }
    await new Promise((resolve) => setTimeout(resolve, 0));
    const res = await fetch('https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi', {
        method: 'POST',
        headers: lodash.merge(BILIBILI_HEADERS, mergeCookie, {
            'Host': `api.bilibili.com`,
            'Origin': 'https://www.bilibili.com',
            'Referer': `https://www.bilibili.com/`,
        }),
        credentials: 'include',
        body: JSON.stringify(json_data),
    });
    return res
}

/**生成 _uuid */
async function gen_uuid() {
    var e = a(8),
        t = a(4),
        r = a(4),
        n = a(4),
        o = a(12),
        i = Date.now();
    function a(e) {
        var t = "";
        for (var r = 0; r < e; r++) {
            t += b(Math.floor(16 * Math.random()));
        }
        return s(t, e);
    }
    function s(e, t) {
        var r = "";
        if (e.length < t) {
            for (var n = 0; n < t - e.length; n++) {
                r += "0";
            }
        }
        return r + e;
    }
    function b(e) {
        return Math.ceil(e).toString(16).toUpperCase();
    }
    let uuid = `_uuid=${e}-${t}-${r}-${n}-${o}${s((i % 1e5).toString(), 5)}infoc;`;
    return uuid;
}

/**生成 b_lsid */
async function gen_b_lsid() {
    function get_part_str(length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += Math.floor(Math.random() * 16).toString(16).toUpperCase();
        }
        return add_zero_char(str, length);
    }
    function add_zero_char(str, length) {
        if (str.length < length) {
            const zeros = '0'.repeat(length - str.length);
            return zeros + str;
        }
        return str;
    }
    const timestamp = Date.now();
    let t = `b_lsid=${get_part_str(8)}_${timestamp.toString(16).toUpperCase()};`;
    return t;
}

/**生成buvid_fp
 * @param {string} _uuid
*/
async function get_buvid_fp(cookie) {
    let payload = await payloadData(cookie);
    const seedget = Math.floor(Math.random() * (6500 - 1 + 1) + 1);
    let buvidFp = gen_buvid_fp(payload, seedget);
    return `buvid_fp=${buvidFp};`;
}

/**获取 buvid3 buvid4 */
async function get_buvid3_buvid4(uuid) {
    const url = 'https://api.bilibili.com/x/frontend/finger/spi/';
    let BILIBILI_HEADERS_COOKIE_WITH_UUID = lodash.merge(BILIBILI_HEADERS, { 'Cookie': `_uuid=${uuid}` });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const response = await fetch(url, {
        method: 'GET',
        headers: lodash.merge(BILIBILI_HEADERS_COOKIE_WITH_UUID, {
            'Host': `api.bilibili.com`,
            'Origin': 'https://www.bilibili.com',
            'Referer': `https://www.bilibili.com/`,
        }),
        redirect: 'follow',
    })
    const data = await response.json();
    const buvid4 = data.data.b_4;
    const buvid3 = data.data.b_3;
    if (data.code == 0) {
        return `buvid3=${buvid3};buvid4=${buvid4};`;
    } else {
        return ''
    }
}

/**获取新的tempCK*/
async function getNewTempCk() {
    const TempCkStatuKey = "Yz:xianxin:bilibili:biliTempCkStatu";
    //const fp_key = "Yz:xianxin:bilibili:ckFpCount";

    let setData = xxCfg.getConfig("bilibili", "set");

    /**是否开启获取tempCK风控报错自动重启，默认关闭*/
    let tempCkflashErrReboot = !!setData.tempCkflashErrReboot === true ? true : false;

    /**是否开启自动重启，刷新tempCk后，默认关闭*/
    let flashTempCkAutoReboot = !!setData.flashTempCkAutoReboot === true ? true : false;

    try {
        const uuid = await gen_uuid();
        const buvid3_buvid4 = await get_buvid3_buvid4(uuid);
        const b_lsid = await gen_b_lsid();
        //const buvid_fp = await get_buvid_fp(uuid);

        let newTempCk = `${uuid}${buvid3_buvid4}${b_lsid}`//${buvid_fp}`;

        await saveTempCk(newTempCk);

        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (3500 - 500 + 1) + 500))); // 延迟一段时间

        const result = await postExClimbWuzhi(newTempCk);

        const data = await result.json(); // 解析校验结果
        const dataCode = data.code; // 获取校验结果的 code
        if (dataCode !== 0) {
            logger?.mark(`trss-xianxin插件：获取tempCK，B站ExC接口校验失败：${JSON.stringify(data)}`); // 记录校验失败的日志
        } else if (dataCode === 0) {
            logger?.mark(`trss-xianxin插件：获取tempCK，B站ExC接口校验成功：${JSON.stringify(data)}`); // 记录校验成功的日志
        }

        await redis.set(TempCkStatuKey, 1, { EX: 3600 * 24 * 2 });
        //await redis.set(fp_key, 1, { EX: 3600 * 24 * 356 });

        if (flashTempCkAutoReboot == true) {
            (logger ?? Bot.logger)?.mark(`trss-xianxin插件：刷新tempCK：已开启自动重启，5秒后在执行重启...`);
            await new Promise(() => setTimeout(() => restart(), 5000));
        }

    } catch (error) {
        (logger ?? Bot.logger)?.error(`trss-xianxin插件：刷新tempCK：${error}`);

        if (tempCkflashErrReboot == true) {
            (logger ?? Bot.logger)?.mark(`trss-xianxin插件：刷新tempCK：已开启报错自动重启，5秒后在执行重启...`);
            await new Promise(() => setTimeout(() => restart(), 5000));
        }
    }
}

/**综合获取ck，返回优先级：localCK > loginCK > tempCK */
async function synCookie() {
    let localCk, tempCk, loginCk, mark, cookie;
    localCk = `${await readLocalBiliCk()}`;
    tempCk = `${await readTempCk()}}`;
    loginCk = `${await readLoginCk()}}`;

    if (localCk?.trim().length > 10) {
        mark = "localCk";
        cookie = localCk;
        return { cookie, mark };
    } else if (loginCk?.trim().length > 10) {
        mark = "loginCk";
        cookie = loginCk + ";";
        return { cookie, mark };
    } else if (tempCk?.trim().length > 10) {
        mark = "tempCk";
        cookie = tempCk;
        return { cookie, mark };
    } else {
        mark = "ckIsEmpty";
        cookie = '';
        return { cookie, mark };
    }
}

/**将参数拼接到url中
 * @param {string} url
 * @param {object} data  示例：data = { host_mid: 12345678, search_type, ad_resource: "5646", };
 * @returns {string}
*/
function appendUrlQueryParams(url, data) {
    const queryString = Object.entries(data)
        .map(([key, value]) => {
            if (value === undefined || value === null) {
                return `${key}=`;
            }
            return `${key}=${value}`//${key}=${encodeURIComponent(JSON.stringify(value))}`;
        })
        .join('&');

    if (queryString !== '') {
        url += `?${queryString}`;
    }

    return url;
}

/**fetch()超时请求终止控制器*/
async function fetchWithTimeout(url, options = {}) {
    const { timeout = 20000 } = options;  //默认20秒

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

/**重启bot*/
async function restart() {
    if (process.env.app_type === "pm2") {
        const ret = await Bot.exec("pnpm run restart");
        if (!ret.error) process.exit();
        Bot.makeLog("error", ["重启错误", ret]);
    } else process.exit()
}

export {
    API,
    BILIBILI_HEADERS,
    appendUrlQueryParams,
    applyQRCode, checkLogin, exitBiliLogin, fetchWithTimeout, getNewTempCk, get_buvid_fp, pollQRCode, postExClimbWuzhi, readLocalBiliCk,
    readLoginCk, readSavedCookieItems, readSavedCookieOtherItems, readTempCk, restart, saveLocalBiliCk,
    saveLoginCK, saveTempCk, synCookie
};