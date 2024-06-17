import moment from "moment";
import xxCfg from "../model/xxCfg.js";
import base from "./base.js";
import { puppeteerRender } from "../components/puppeteerRender.js";
import fetch from "node-fetch";
import common from "../../../lib/common/common.js";
import cheerio from 'cheerio';

/**统一设置header */
const header = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-language': 'zh-CN,zh;q=0.9',
    'authority': 'm.weibo.cn',
    'cache-control': 'max-age=0',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'same-origin',
    'sec-fetch-site': 'same-origin',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36'
};

export default class Weibo extends base {
    constructor(e) {
        super(e);
        this.model = "weibo";
    }

    /**通过uid获取博主信息 */
    async get_bozhu_info(target) {
        const param = { containerid: '100505' + target };
        const url = new URL('https://m.weibo.cn/api/container/getIndex');
        url.search = new URLSearchParams(param).toString();

        const response = await fetch(url, { method: 'GET' });
        const res_dict = await response.json();

        return res_dict;
    }

    /**通过关键词搜索微博大v */
    async search_bozhu_info(keyword) {
        let url = `https://weibo.com/ajax/side/search?q=${keyword}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://weibo.com' },
            redirect: "follow",
        });
        const res = await response.json();
        return res;
    }

    /**获取主页动态资源相关数组 */
    async get_weiboDynamic_list(target) {
        const params = { containerid: '107603' + target };
        const url = new URL('https://m.weibo.cn/api/container/getIndex');
        url.search = new URLSearchParams(params).toString();

        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 1000 + 1) + 1000)));

        try {
            const response = await fetch(url, { method: 'GET', timeout: 15000 });
            const res_data = await response.json();

            if (!res_data.ok && res_data.msg !== '这里还没有内容') {
                throw new Error(response.url);
            }

            function custom_filter(d) {
                return d.card_type === 9;
            }

            return res_data.data.cards.filter(custom_filter);
        } catch (error) {
            (logger ?? Bot.logger)?.mark('微博推送：Error fetching sub list:', error);
            return [];
        }
    }

    /**获取文章id */
    get_id(post) {
        return post.mblog.id;
    }

    filter_platform_custom(raw_post) {
        return raw_post.card_type === 9;
    }

    /**将微博原始数据中的创建时间（created_at）转换为 UNIX 时间戳（以毫秒为单位） */
    get_date(raw_post) {
        const created_time = Date.parse(raw_post?.mblog?.created_at || raw_post?.created_at);
        return created_time;
    }

    /**判断动态类型，返回分类标识 */
    get_category(raw_post) {
        if (raw_post?.mblog?.retweeted_status) {
            return "DYNAMIC_TYPE_FORWARD";
        } else if (raw_post?.mblog?.page_info && raw_post?.mblog?.page_info?.type === 'video') {
            return "DYNAMIC_TYPE_AV";
        } else if (raw_post?.mblog?.pics) {
            return "DYNAMIC_TYPE_DRAW";
        } else {
            return "DYNAMIC_TYPE_ARTICLE";
        }
    }

    /**筛选正文文字 */
    _get_text(raw_text) {
        const text = raw_text.replace(/<br \/>/g, '\n');
        return cheerio.load(text).text();
    }

    /**动态获取、推送流程 */
    async upTask() {
        let setData = xxCfg.getConfig("weibo", "set");
        let pushData = xxCfg.getConfig("weibo", "push");

        // 推送2小时内的微博动态
        let interval = 7200;

        const uidMap = new Map();

        // 存放获取的所有动态 key为uid value为数组
        const dynamicList = {};
        for (let key in pushData) {
            const ups = pushData[key] || [];
            for (let up of ups) {

                const response = await this.get_weiboDynamic_list(up.uid);

                if (response) {
                    const dynamicData = response;
                    dynamicList[up.uid] = dynamicData;
                }
                uidMap.set(up.uid, {
                    groupIds: Array.from(
                        new Set([
                            ...((uidMap.get(up.uid) && uidMap.get(up.uid).groupIds) || []),
                            key,
                        ])
                    ),
                    e_self_id: up.e_self_id || [],
                    upName: up.name,
                    type: up.type || [],
                });

                await common.sleep(2000);
            }
        }

        let now = Date.now() / 1000;

        this.key = "Yz:xianxin:weibo:upPush:";

        for (let [key, value] of uidMap) {

            const tempDynamicList = dynamicList[key] || [];

            const willPushDynamicList = [];

            for (let dynamicItem of tempDynamicList) {
                let raw_post = dynamicItem || {};
                if (!raw_post?.mblog?.created_at) continue;
                /** 不满足时间的不放入待推送动态 */
                if (Number(now - (this.get_date(raw_post) / 1000)) > interval) {
                    continue;
                }

                /** 如果关闭了转发动态不推送, 那么直接在这里不放入待推送数据里 */
                if (this.get_category(dynamicItem) == "DYNAMIC_TYPE_FORWARD" && !setData.pushTransmit) {
                    continue;
                }
                willPushDynamicList.push(dynamicItem);
            }

            const pushMapInfo = value || {};

            const { groupIds, e_self_id, upName, type } = pushMapInfo;

            let willPushDynamicData = Array.from(willPushDynamicList, item => ({ ...item }));
            for (let i = 0; i < willPushDynamicData.length; i++) {
                if (groupIds && groupIds.length) {
                    for (let groupId of groupIds) {
                        /** 如果禁用了type那么不发送指令 */
                        if (type && type.length && !type.includes(this.get_category(willPushDynamicData[i]))) {
                            continue;
                        }
                        await this.sendDynamic(groupId, e_self_id, upName, willPushDynamicData[i], setData);
                        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (10500 - 2000 + 1) + 2000)));
                    }
                }
            }
            await common.sleep(1000);
        }
    }

    async sendDynamic(groupId, e_self_id, upName, pushDynamicData, setData) {
        const id_str = pushDynamicData?.mblog?.mid || pushDynamicData?.mblog?.id;

        let sended = await redis.get(`${this.key}${groupId}:${id_str}`);
        if (sended) return;

        const yunzaiName = await xxCfg.getYunzaiName();

        if (!!setData.pushMsgMode) {
            const data = await this.dynamicDataHandle(pushDynamicData);
            // 包含关键字不推送
            let banWords = eval(`/${setData.banWords.join("|")}/g`);
            if (new RegExp(banWords).test(`${data.data.content}`)) {
                return "return";
            }

            //判断是否启用分片截图，默认为 true
            let isSplit = !!setData.isSplit === false ? false : true;

            /**分片截图模式的css样式参数 */
            let style = ''
            if (isSplit == true) {
                style = '.ql-editor { max-height: 100% !important; }'
            }

            if (!this[id_str]) {
                const dynamicMsg = await this.render(data, isSplit, style);
                const { img, code } = dynamicMsg;

                this[id_str] = {
                    img: img,
                };
            }

            redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 });

            (logger ?? Bot.logger)?.mark("trss-xianxin插件：微博动态执行推送");

            /*QQ频道午夜时间推送有限制，会报错code: 304022*/
            const images = Array.from(this[id_str].img, item => ({ ...item }));
            for (let i = 0; i < images.length; i++) {
                let uin = yunzaiName === 'miao-yunzai' ? e_self_id : undefined;
                await (Bot[uin] ?? Bot).pickGroup(String(groupId)).sendMsg(images[i]) // 发送动态图片消息
                  .catch((err) => {
                    (logger ?? Bot.logger)?.mark(`群/子频道[${groupId}]推送失败：${JSON.stringify(err)}`);
                  });
                await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 2000))); // 随机延时2-6.5秒
              }
            await common.sleep(1000);
        } else {
            const dynamicMsg = this.buildDynamic(upName, pushDynamicData, false, setData); // 构建普通动态消息

            redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 });

            if (dynamicMsg == "continue") {
                return "return";
            }

            // 包含关键字不推送
            let banWords = eval(`/${setData.banWords.join("|")}/g`);
            if (new RegExp(banWords).test(dynamicMsg.join(""))) {
                return "return";
            }

            let uin = yunzaiName === 'miao-yunzai' ? e_self_id : undefined;
            await (Bot[uin] ?? Bot).pickGroup(String(groupId)).sendMsg(dynamicMsg) // 发送普通动态消息
              .catch((err) => {
                (logger ?? Bot.logger)?.mark(`群/子频道[${groupId}]推送失败：${JSON.stringify(err)}`);
              });
            await common.sleep(1000);
        }
    }

    /** 获取并生成微博动态渲染数据 */
    async dynamicDataHandle(raw_post) {
        /* 初始数据进一步处理 **************** */
        let info = raw_post?.mblog || raw_post;
        let retweeted = info && info?.retweeted_status ? true : false;
        let pic_num = retweeted ? info?.retweeted_status?.pic_num : info?.pic_num;
        let type = this.get_category(raw_post)

        if (info?.isLongText || pic_num > 9) {
            const res = await fetch(`https://m.weibo.cn/detail/${info.mid}`, { headers: header });
            try {
                const text = await res.text();
                const match = text.match(/"status": ([\s\S]+),\s+"call"/);
                if (match) {
                    const full_json_text = match[1];
                    info = JSON.parse(full_json_text);
                }
            } catch (err) {
                (logger ?? Bot.logger)?.mark(`trss-xianxin插件：微博 detail message error(https://m.weibo.cn/detail/${info?.mid})`);
            }
        }

        /**头像链接 */
        const face_url = info?.user?.profile_image_url;
        /**昵称 */
        const nick_name = info?.user?.screen_name;
        /**动态发布时间 */
        let created_time = this.get_date(raw_post)
        /**动态详情链接 */
        let detail_url = `https://weibo.com/${info?.user?.id}/${info?.bid}`;


        /* 构造动态渲染数据 *************************** */
        let data;
        let pics = [];
        let dynamic = { data: {} };

        /**头像 */
        dynamic.data.face = face_url;
        /**昵称 */
        dynamic.data.name = nick_name;

        /**头像框 */
        dynamic.data.pendant = '';

        dynamic.data.created = moment().format("YYYY年MM月DD日 HH:mm:ss");

        dynamic.data.type = type;
        if (type == "DYNAMIC_TYPE_AV") {
            dynamic.data.title = info?.page_info?.title || "";
            dynamic.data.content = info?.text;
            dynamic.data.url = detail_url;
            dynamic.data.pubTs = moment(created_time).format(
                "YYYY年MM月DD日 HH:mm:ss"
            );
            dynamic.data.category = "视频动态";
            dynamic.data.pics = [info?.page_info?.page_pic?.url] || [];
        } else if (type == "DYNAMIC_TYPE_DRAW") {
            let raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
            pics = raw_pics_list.map(img => img?.large?.url) || [];
            dynamic.data.title = "";
            dynamic.data.content = info?.text;
            dynamic.data.url = detail_url;
            dynamic.data.pubTs = moment(created_time).format(
                "YYYY年MM月DD日 HH:mm:ss"
            );
            dynamic.data.pics = pics;
            dynamic.data.category = "图文动态";
        } else if (type == "DYNAMIC_TYPE_ARTICLE") {
            let raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
            pics = raw_pics_list.map(img => img?.large?.url) || [];
            dynamic.data.title = "";
            dynamic.data.content = info?.text;
            dynamic.data.url = detail_url;
            dynamic.data.pubTs = moment(created_time).format(
                "YYYY年MM月DD日 HH:mm:ss"
            );
            dynamic.data.pics = pics;
            dynamic.data.category = "文章动态";
        } else if (type == "DYNAMIC_TYPE_FORWARD") {
            dynamic.data.title = "";
            dynamic.data.content = info?.text;
            dynamic.data.pubTs = moment(created_time).format(
                "YYYY年MM月DD日 HH:mm:ss"
            );
            dynamic.data.url = detail_url;
            dynamic.data.pics = [];
            let origin_post_info = info?.retweeted_status
            dynamic.data.orig = await this.dynamicDataHandle(origin_post_info);
            dynamic.data.category = "转发动态";
        }

        return {
            ...this.screenData,
            saveId: info?.id,
            ...dynamic,
        };
    };

    /**
     * 生成微博动态图片
     * @param {object} param
     * @param {boolean} isSplit 是否为分片截图：true / false
     * @param {string} style 修改模版渲染后的html中某元素的css样式，传入示例 '.ql-editor { max-height: 100% !important; }'
     * @param {object} header 添加puppeteer渲染时网络资源获取请求头，例如：{ 'referer': 'https://example.com' }
     * @returns {img: string[], code: string}
     */
    async render(param, isSplit, style) {
        return await puppeteerRender.screenshot(this.model, param, isSplit, style, { 'referer': 'https://weibo.com' })
    }

    // 生成动态消息文字内容
    async buildDynamic(upName, raw_post, isForward, setData) {
        let msg,
            /**全部图片资源链接*/
            raw_pics_list,
            /**图片高清资源链接*/
            pic_urls,
            /**图片*/
            pics;

        let info = raw_post?.mblog || raw_post;
        let retweeted = info && info.retweeted_status ? true : false; //是否为转发动态
        let pic_num = retweeted ? info?.retweeted_status?.pic_num : info?.pic_num;
        let type = this.get_category(raw_post)

        /**获取动态全文 */
        if (info?.isLongText || pic_num > 9) {
            const res = await fetch(`https://m.weibo.cn/detail/${info.mid}`, { headers: header });
            try {
                const text = await res.text();
                const match = text.match(/"status": ([\s\S]+),\s+"call"/);
                if (match) {
                    const full_json_text = match[1];
                    info = JSON.parse(full_json_text);
                }
            } catch (err) {
                (logger ?? Bot.logger)?.mark(`trss-xianxin插件：微博 detail message error(https://m.weibo.cn/detail/${info?.mid})`);
            }
        }

        /**动态发布时间 */
        let created_time = this.get_date(raw_post)

        let detail_url = `https://weibo.com/${info?.user?.id}/${info?.bid}`;

        let title = `微博【${upName}】动态推送：\n`;

        const dynamicPicCountLimit = setData.pushPicCountLimit || 3;

        switch (type) {
            case "DYNAMIC_TYPE_AV":
                if (!info) return;

                let cover_img_url = info?.page_info?.page_pic?.url

                let cover_img = segment.image(cover_img_url, false, 15000, { referer: "https://weibo.com", });

                title = `微博【${upName}】视频动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `标题：${info?.page_info?.title || ""}\n`,
                    `${this._get_text(info?.text)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""
                    }\n`,
                    cover_img,
                ];

                return msg;
            case "DYNAMIC_TYPE_DRAW":
                raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];

                if (!info && !raw_pics_list) return;

                if (raw_pics_list.length > dynamicPicCountLimit)
                    raw_pics_list.length = dynamicPicCountLimit;

                pic_urls = raw_pics_list.map(img => img?.large?.url);

                pics = []

                for (let pic_url of pic_urls) {
                    const temp = segment.image(pic_url, false, 15000, { referer: "https://weibo.com", });
                    pics.push(temp);
                }

                title = `微博【${upName}】图文动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(this._get_text(info?.text), setData)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""
                    }\n`,
                    ...pics,
                ];

                return msg;
            case "DYNAMIC_TYPE_ARTICLE":
                if (!info) return;

                raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];

                if (raw_pics_list.length > dynamicPicCountLimit)
                    raw_pics_list.length = dynamicPicCountLimit;

                pic_urls = raw_pics_list.map(img => img?.large?.url);

                pics = []

                for (const pic_url of pic_urls) {
                    const temp = segment.image(pic_url, false, 15000, { referer: "https://weibo.com", });
                    pics.push(temp);
                }

                title = `微博【${upName}】文章动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `正文：${this.dynamicContentLimit(this._get_text(info?.text), setData)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""
                    }\n`,
                    ...pics,
                ];

                return msg;
            case "DYNAMIC_TYPE_FORWARD":
                if (!info) return;
                if (!info?.retweeted_status) return;

                const origin_post_info = info?.retweeted_status
                let orig = await this.buildDynamic(upName, origin_post_info, true, setData);

                if (orig && orig.length) {
                    orig = orig.slice(2);
                } else {
                    return false;
                }

                title = `微博【${upName}】转发动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(this._get_text(info?.text), setData)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""
                    }\n`,
                    "\n---以下为转发内容---\n",
                    ...orig,
                ];

                return msg;
            default:
                (logger ?? Bot.logger)?.mark(`未处理的微博推送【${upName}】：${type}`);
                return "continue";
        }
    }

    // 限制文字模式下动态内容的字数和行数
    dynamicContentLimit(content, setData) {
        content = content.split("\n");

        let lenLimit = setData.pushContentLenLimit || 100;
        let lineLimit = setData.pushContentLineLimit || 5;

        if (content.length > lineLimit) content.length = lineLimit;

        let contentLen = 0;
        let outLen = false;
        for (let i = 0; i < content.length; i++) {
            let len = lenLimit - contentLen;

            if (outLen) {
                content.splice(i--, 1);
                continue;
            }
            if (content[i].length > len) {
                content[i] = content[i].substr(0, len);
                content[i] = `${content[i]}...`;
                contentLen = lenLimit;
                outLen = true;
            }
            contentLen += content[i].length;
        }

        return content.join("\n");
    }

    // 处理斜杠开头的url
    formatUrl(url) {
        if (url.indexOf("//") == 0) {
            return `https:${url}`;
        }
        return url;
    }
}