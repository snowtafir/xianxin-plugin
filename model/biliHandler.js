import xxCfg from "./xxCfg.js";
import { _headers } from "./bilibili.js";
import lodash from 'lodash';
import fetch from "node-fetch";
import md5 from 'md5';

const PayloadReplaceCode = {
    abtest: "54ef",
    addBehavior: "6527",
    audio: "d02f",
    availableScreenResolution: "d61f",
    b_nut_h: "3bf4",
    browser_resolution: "6e7c",
    buvid_fp: "737f",
    canva_novalid: "e8ad",
    canvas: "13ab",
    colorDepth: "5766",
    cookieEnabled: "807e",
    cpuClass: "d52f",
    deviceMemory: "1c57",
    fonts: "a658",
    hardwareConcurrency: "0bd0",
    hasLiedBrowser: "097b",
    hasLiedLanguages: "ed31",
    hasLiedOs: "72bd",
    hasLiedResolution: "2673",
    indexedDb: "7003",
    is_selfdef: "db46",
    laboratory: "5f45",
    language: "07a4",
    localStorage: "3b21",
    lsid: "507f",
    msg: "3c43",
    openDatabase: "8a1c",
    platform: "adca",
    plugins: "80c9",
    refer_url: "8b94",
    screenResolution: "748e",
    screenx: "d402",
    screeny: "654a",
    sessionStorage: "75b8",
    spm_id: "spm_id",
    target_url: "34f1",
    timestamp: "5062",
    timezone: "6aa9",
    timezoneOffset: "fc9d",
    touchSupport: "52cd",
    url: "03bf",
    userAgent: "b8ce",
    uuid: "df35",
    webdriver: "641c",
    webglVendorAndRenderer: "6bc5",
    webgl_novalid: "102a",
    webgl_params: "a3c1",
    webgl_str: "bfe9",
}
/*Payload_Items*/
const biliPayloadItems = {
    "ptype": 1,
    "timestamp": "",
    "url": '',
    "spm_id": "333.999.fp.risk",
    "target_url": "",
    "screenx": "",
    "screeny": "",
    "browser_resolution": "809x1081",
    "abtest": {
        "in_new_ab": true,
        "ab_version": {
            "unify_fetch": "V1",
            "for_new_opus_version": "NEW"
        },
        "refer_url": "",
        "uuid": "",
        "language": "zh-CN",
        "laboratory": null,
        "is_selfdef": 0
    },
    "msg": {
        "hasLiedResolution": 0,
        "colorDepth": 24,
        "addBehavior": 0,
        "indexedDb": 1,
        "cookieEnabled": 1,
        "webdriver": 0,
        "language": "zh-CN",
        "deviceMemory": 8,
        "hardwareConcurrency": 16,
        "screenResolution": [1920, 1200],
        "availableScreenResolution": [1920, 1080],
        "timezoneOffset": -480,
        "timezone": "Asia/Shanghai",
        "sessionStorage": 1,
        "localStorage": 1,
        "openDatabase": 1,
        "cpuClass": "not available",
        "platform": "Win32",
        "audio": "124.04437527516075",
        "plugins": [
            ["PDF Viewer",
                "Portable Document Format",
                [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]
            ],
            ["Chrome PDF Viewer",
                "Portable Document Format",
                [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]
            ],
            ["Chromium PDF Viewer",
                "Portable Document Format",
                [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]
            ],
            ["Microsoft Edge PDF Viewer",
                "Portable Document Format",
                [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]
            ],
            ["WebKit built-in PDF",
                "Portable Document Format",
                [
                    ["application/pdf", "pdf"],
                    ["text/pdf", "pdf"]
                ]
            ]
        ],
        "webgl_params": [
            "extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_disjoint_timer_query;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_texture_compression_bptc;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;EXT_sRGB;KHR_parallel_shader_compile;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linearOES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_color_buffer_float;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_debug_shaders;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_multi_draw ",
            "webgl aliased line width range:[1, 1]",
            "webgl aliased point size range:[1, 1024]",
            "webgl alpha bits:8",
            "webgl antialiasing:yes",
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
            "webgl renderer:WebKit WebGL",
            "webgl shading language version:WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)",
            "webgl stencil bits:0",
            "webgl vendor:WebKit",
            "webgl version:WebGL 1.0 (OpenGL ES 2.0 Chromium)",
            "webgl unmasked vendor:Google Inc. (Intel)",
            "webgl unmasked renderer:ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_4_8 ps_4_8, D3D11)",
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
        "webglVendorAndRenderer": "Google Inc. (Intel)~ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_4_8 ps_4_8, D3D11)",
        "hasLiedLanguages": 0,
        "hasLiedOs": 0,
        "hasLiedBrowser": 0,
        "touchSupport": [0, 0, 0],
        "fonts": ["Arial",
            "Arial Black",
            "Arial Narrow",
            "Book Antiqua",
            "Bookman Old Style",
            "Calibri",
            "Cambria",
            "Cambria Math",
            "Century",
            "Century Gothic",
            "Comic Sans MS",
            "Consolas",
            "Courier",
            "Courier New",
            "Georgia", "Helvetica",
            "Impact",
            "Lucida Console",
            "Lucida Handwriting",
            "Lucida Sans Unicode",
            "Microsoft Sans Serif",
            "Monotype Corsiva",
            "MS Gothic",
            "MS PGothic",
            "MS Reference Sans Serif",
            "MS Sans Serif",
            "MS Serif",
            "Palatino Linotype",
            "Segoe Print",
            "Segoe Script",
            "Segoe UI",
            "Segoe UI Light",
            "Segoe UI Semibold",
            "Segoe UI Symbol",
            "Tahoma",
            "Times",
            "Times New Roman",
            "Trebuchet MS",
            "Verdana",
            "Wingdings",
            "Wingdings 2",
            "Wingdings 3"
        ],
        "userAgent": '',
        "canvas": '',
        "webgl_str": '',

    },
}

//重排码
const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
]
/**构建wbi签名 */
class BiliWbi {
    static temporaryCookie = null;
    static cookieTimeStamp = -1;
    // 获取最新的 img_key 和 sub_key
    static async getWbiKeys() {
        const url = 'https://api.bilibili.com/x/web-interface/nav';
        await new Promise((resolve) => setTimeout(resolve, 0));
        const resp = await fetch(url);
        const json_content = await resp.json();
        const img_url = json_content.data.wbi_img.img_url;
        const sub_url = json_content.data.wbi_img.sub_url;
        return {
            img_key: img_url.substring(img_url.lastIndexOf('/') + 1, img_url.length).split('.')[0],
            sub_key: sub_url.substring(sub_url.lastIndexOf('/') + 1, sub_url.length).split('.')[0]
        }
    }

    // 对 imgKey 和 subKey 进行字符顺序打乱编码
    static getMixinKey(orig) {
        let temp = ''
        mixinKeyEncTab.forEach((n) => {
            temp += orig[n]
        })
        return temp.slice(0, 32)
    }

    // 为请求参数进行 wbi 签名的方法
    static encWbi(params, img_key, sub_key) {
        const mixin_key = this.getMixinKey(img_key + sub_key),
            curr_time = Math.round(Date.now() / 1000),
            chr_filter = /[!'\(\)*]/g
        let query = []
        params = Object.assign(params, { wts: curr_time })    // 添加 wts 字段
        // 按照 key 重排参数
        Object.keys(params).sort().forEach((key) => {
            query.push(
                encodeURIComponent(key) +
                '=' +
                // 过滤 value 中的 "!'()*" 字符
                encodeURIComponent(('' + params[key]).replace(chr_filter, ''))
            )
        })
        query = query.join('&')
        const wbi_sign = md5(query + mixin_key) // 计算 w_rid
        return query + '&w_rid=' + wbi_sign
    }

    /** 对实际请求参数进行 wbi 签名 */
    static async wbi_Code() {
        let params = {
            method: "GET",
            headers: _headers,
        };

        /**缓存获取的 img_key 和 sub_key到redis并设置过期时间 30分钟 && 执行 wbi签名*/
        this.key = "Yz:xianxin:bilibili:Wbi_Nav_Keys";
        try {
            let wbi_keys = JSON.parse(await redis.get(`${this.key}`));
            /** 执行 wbi签名*/
            this.encWbi(
                params,
                wbi_keys.img_key,
                wbi_keys.sub_key
            );
            /*Bot.logger?.mark("xianxin插件：B站接口 wbi_keys读取成功");*/
        } catch (e) {
            //Bot.logger?.mark("xianxin插件：正在更新wbi_keys");
            let wbi_keys = await this.getWbiKeys();
            let wbikeys = wbi_keys;
            let wbi = JSON.stringify(wbi_keys)
            redis.set(`${this.key}`, `${wbi}`, { EX: 1800 });
            /** 执行 wbi签名*/
            this.encWbi(
                params,
                wbikeys.img_key,
                wbikeys.sub_key
            );
            //Bot.logger?.mark("xianxin插件：B站接口 更新wbi_keys成功");
        };
    }
}

/**cookie相关操作 */
class BiliHandler {
    /**获取本地绑定的cookie  ['buvid3', 'buvid4', '_uuid', 'DedeUserID', 'b_nut', 'b_lsid', 'bili_jct', 'SESSDATA',]*/
    static async getLocalCookie() {
        let permanentCookie = await xxCfg.getBiliCk();
        let Bck = lodash.trim(permanentCookie);
        if ((Bck !== null) && (Bck !== undefined) && (Bck.length !== 0) && (Bck !== '')) {
            var keysToKeep = ['buvid3', 'buvid4', '_uuid', 'DedeUserID', 'b_nut', 'b_lsid', 'bili_jct', 'SESSDATA'];
            var localCk = String(Bck)
                .trim()
                .match(/(\w+)=([^;|,]+)/g) /**使用正则表达式 /(\w+)=([^;]+);/g 来匹配形式为 a=b 的内容,使用 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符*/
                ?.map(match => match.split('='))
                .filter(([key, value]) => keysToKeep.includes(key) && value !== '') /**过滤并仅保留键值对中值为非空的情况*/
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            return localCk
        } else {
            localCk = ''
            return localCk
        }
    }

    /**获取本地绑定的cookie的某个值，入参格式： ['buvid3', 'buvid4', '_uuid', 'DedeUserID', 'b_nut', 'b_lsid', 'bili_jct', 'SESSDATA'];*/
    static async getLocalCookieItem(keysToKeep) {
        let permanentCookie = await xxCfg.getBiliCk();
        let Bck = lodash.trim(permanentCookie);
        if ((Bck !== null) && (Bck !== undefined) && (Bck.length !== 0) && (Bck !== '')) {
            var map_key = String(Bck)
                .trim()
                .match(/(\w+)=([^;|,]+)/g) /**使用正则表达式 /(\w+)=([^;]+);/g 来匹配形式为 a=b 的内容,使用 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符*/
                ?.map(match => match.split('='))
                .filter(([key, value]) => keysToKeep.includes(key) && value !== '') /**过滤并仅保留键值对中值为非空的情况*/
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            return `${map_key};`
        } else {
            map_key = ''
            return map_key
        }
    }

    /**获取临时cookie的某个值，入参格式： ['buvid3', 'buvid4', '_uuid', 'DedeUserID', 'b_nut', 'b_lsid', 'bili_jct', 'SESSDATA'];*/
    static async getTemCookieItem(keysToKeep) {
        let TemCookie = await BiliHandler.getTempCk();
        let Bck = lodash.trim(TemCookie);
        if ((Bck !== null) && (Bck !== undefined) && (Bck.length !== 0) && (Bck !== '')) {
            var map_key = String(Bck)
                .trim()
                .match(/(\w+)=([^;|,]+)/g) /**使用正则表达式 /(\w+)=([^;]+);/g 来匹配形式为 a=b 的内容,使用 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符*/
                ?.map(match => match.split('='))
                .filter(([key, value]) => keysToKeep.includes(key) && value !== '') /**过滤并仅保留键值对中值为非空的情况*/
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            return `${map_key}`
        } else {
            map_key = ''
            return map_key
        }
    }

    /**获取 buvid3 buvid4 */
    static async get_buvid3_buvid4() {
        const url = 'https://api.bilibili.com/x/frontend/finger/spi/';
        await new Promise((resolve) => setTimeout(resolve, 0));
        const response = await fetch(url, {
            method: 'GET',
            headers: _headers,
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

    /**获取 buvid3 b_nut*/
    static async get_b_nut() {
        const url = 'https://space.bilibili.com/401742377/dynamic';
        await new Promise((resolve) => setTimeout(resolve, 0));
        const response = await fetch(url, {
            method: 'GET',
            headers: _headers,
            redirect: 'follow',
        });

        const setCookie = response.headers.get('set-cookie');
        if ((setCookie !== null) && (setCookie !== undefined) && (setCookie.length !== 0) && (setCookie !== '')) {
            var keysToKeep = ['b_nut'];
            let map_key = String(setCookie)
                .trim()
                .match(/(\w+)=([^;|,]+)/g) /**使用正则表达式 /(\w+)=([^;]+);/g 来匹配形式为 a=b 的内容,使用 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了 分号 , 以外的任意字符*/
                .map(match => match.split('='))
                .filter(([key, value]) => keysToKeep.includes(key) && value !== '') /**过滤并仅保留键值对中值为非空的情况*/
                .map(([key, value]) => `${key}=${value}`)
                .join(';');
            return `${map_key};`
        } else {
            return ''
        }
    }

    /**生成 b_lsid */
    static async get_b_lsid() {
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
        const t = `b_lsid=${get_part_str(8)}_${timestamp.toString(16).toUpperCase()};`;
        return t;
    }

    /**生成 _uuid */
    static async get_uuid() {
        var e = a(8),
            t = a(4),
            r = a(4),
            n = a(4),
            o = a(12),
            i = Date.now();
        let uuid = `_uuid=${e}-${t}-${r}-${n}-${o}${s((i % 1e5).toString(), 5)}infoc;`;
        return uuid

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
    }

    /**请求参数POST接口(ExClimbWuzhi)过校验*/
    static async postExClimbWuzhiParam(cookie, uid) {
        const payloadData = {
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
                "b8ce": _headers['user-agent'], // ua
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
                "adca": _headers['user-agent'].includes('Windows') ? 'Win32' : 'Linux', // platform, navigator.platform
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
            "df35": (await BiliHandler.getLocalCookieItem(['_uuid'])).length === 0 ? (await BiliHandler.getTemCookieItem(['_uuid'])) :(await BiliHandler.getLocalCookieItem(['_uuid'])), // _uuid, set from cookie, generated by client side(algorithm remains unknown)
            "07a4": "zh-CN", // language
            "5f45": null, // laboratory, set from cookie, null if empty, source remains unknown
            "db46": 0 // is_selfdef, default 0
        };
        const json_data = {
            payload: JSON.stringify(payloadData),
        };
        let dataLength = String(json_data).length - 1;
        let mergeCookie = { cookie: `${cookie}`, 'content-type': 'application/json', 'charset': 'UTF-8', 'Content-Length': `${dataLength}`, }
        await new Promise((resolve) => setTimeout(resolve, 0));
        const res = await fetch('https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi', {
            method: 'POST',
            headers: lodash.merge(_headers, mergeCookie, { 'Referer': `https://space.bilibili.com/${uid}/dynamic`,}),
            credentials: 'include',
            body: JSON.stringify(json_data),
        });
        return res
    }

    /**获取临时cookie*/
    static async getTempCk() {
        var tempCk = '';
        var ckKey = "Yz:xianxin:bilibili:biliTempCookie";
        tempCk = await redis.get(ckKey);

        if ((tempCk == null) || (tempCk == undefined) || (tempCk.length == 0) || (tempCk == '')) {
            const b_nut = await BiliHandler.get_b_nut();
            const uuid = await BiliHandler.get_uuid();
            const buvid3_buvid4 = await BiliHandler.get_buvid3_buvid4();
            const b_lsid = await  BiliHandler.get_b_lsid();

            tempCk = `${b_nut}${uuid}${buvid3_buvid4}${b_lsid}`

            redis.set(ckKey, tempCk, { EX: 3600 * 24 * 360 });
            return tempCk;
        } else {
            return tempCk;
        }
    }
}

export { BiliHandler, BiliWbi } 