import moment from "moment";
import xxCfg from "../model/xxCfg.js";
import { BiliHandler, BiliWbi } from "./biliHandler.js";
import base from "./base.js";
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import fetch from "node-fetch";
import common from "../../../lib/common/common.js";
import md5 from 'md5'
import lodash from 'lodash'

/**统一设定请求头 header */
const _headers = {
  'cache-control': 'no-cache',
  cookie: '',
  pragma: 'no-cache',
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
  'sec-ch-ua-mobile': '?0',
  'sec-fetch-dest': "document",
  'sec-fetch-mode': "navigate",
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': 1,
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:100.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
}
/*Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36*/
/*'Mozilla/5.0 (X11; Linux x86_64; rv:100.0) Gecko/20100101 Firefox/100.0'*/
export { _headers }

export default class Bilibili extends base {
  constructor(e) {
    super(e);
    this.model = "bilibili";
  }
  async getBilibiliDetail(uid) {
    let url = `https://api.bilibili.com/x/relation/stat?vmid=${uid}`;
    let localCk = await BiliHandler.getLocalCookie();
    var miniBck = ''

    if (!localCk || localCk.trim().length === 0) {
      miniBck = `${await BiliHandler.getTempCk()}DedeUserID=${uid};`
    } else {
      miniBck = localCk
    }
    const cookie = { 'cookie': `${miniBck}`, }
    const response = await fetch(url, {
      method: "GET",
      headers: lodash.merge(_headers, cookie),
      redirect: "follow",
    });
    return response;
  }

  async getBilibiliUserInfo(uid) {
    try {
      let wrid = await BiliWbi.wbi_Code();
      let url = `https://api.bilibili.com/x/space/wbi/acc/info?mid=${uid}${wrid}&jsonp=jsonp`;
      let localCk = await BiliHandler.getLocalCookie();
      var miniBck = ''

      if (!localCk || localCk.trim().length === 0) {
        miniBck = `${await BiliHandler.getTempCk()}DedeUserID=${uid};`
      } else {
        miniBck = localCk
      }
      const cookie = { 'cookie': `${miniBck}`, }
      const response = await fetch(url, {
        method: "GET",
        headers: lodash.merge(_headers, cookie),
        redirect: "follow",
      });
      return response;
    } catch (e) {
      Bot.logger?.mark("xianxin插件：B站up信息请求失败");
      return;
    }
  }

  async getBilibiliUserInfoDetail(uid) {
    try {
      let wrid = await BiliWbi.wbi_Code(1);
      let url = `https://api.obfs.dev/api/bilibili/v3/user_info?uid=${uid}&${wrid}`;
      let localCk = await BiliHandler.getLocalCookie();
      var miniBck = ''

      if (!localCk || localCk.trim().length === 0) {
        miniBck = `${await BiliHandler.getTempCk()}DedeUserID=${uid};`
      } else {
        miniBck = localCk
      }
      const cookie = { 'cookie': `${miniBck}`, }
      const response = await fetch(url, {
        method: "GET",
        headers: lodash.merge(_headers, cookie),
        redirect: "follow",
      });
      return response;
    } catch (e) {
      Bot.logger?.mark("xianxin插件：B站up详情请求失败");
      return;
    }
  }

  async getBilibiliDynamicInfo(uid) {
    let url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=${uid}`;
    let localCk = await BiliHandler.getLocalCookie();
    var cookie = ''

    if (!localCk || localCk.trim().length === 0) {
      cookie = `${await BiliHandler.getTempCk()}DedeUserID=${uid};`
    } else {
      cookie = localCk
    }

    var mergeCookie = { cookie: `${cookie}`, }
    const response = await fetch(url, {
      method: 'GET',
      headers: lodash.merge(_headers, mergeCookie),
      redirect: 'follow',
    }).then(res => {
      if (res.ok) {
        return res
      }
    })

    const resData = await response.json()
    let resDataCode = resData.code
    Bot.logger?.mark(`B站动态请求code:${JSON.stringify(resDataCode)}`)

    /**执行分支 */
    if (resDataCode === 0) {
      return resData;
    } else {
      const result = await BiliHandler.postExClimbWuzhiParam(cookie);
      const data = await result.json();
      const dataCode = data.code;

      if (dataCode === 0) {
        const response1 = await fetch(url, {
          method: 'GET',
          headers: lodash.merge(_headers, mergeCookie),
          redirect: 'follow',
        });
        const resData1 = await response1.json();
        const resDataCode1 = resData1.code

        if (resDataCode1 === 0) {
          return resData1
        } else {
          let userAgent = { 'user-agent': 'Mozilla/5.0', 'cookie': `${cookie}` };
          const response4 = await fetch(url, {
            method: 'GET',
            headers: lodash.merge(_headers, userAgent),
            redirect: 'follow',
          });
          const resData4 = await response4.json()
          return resData4
        }
      } else if (dataCode !== 0) {
        let userAgent = { 'user-agent': 'Mozilla/5.0', 'cookie': `${cookie}` };
        const response3 = await fetch(url, {
          method: 'GET',
          headers: lodash.merge(_headers, userAgent),
          redirect: 'follow',
        });
        const resData3 = await response3.json()
        return resData3;
      }
    }
    /*Bot.logger?.mark("xianxin插件：B站up动态请求失败")*/
  }

  async getBilibiliUp(keyword) {
    let url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&page=1&search_type=bili_user&order=totalrank&pagesize=5`;
    let localCk = await BiliHandler.getLocalCookie();
    var miniBck = ''

    if (!localCk || localCk.trim().length === 0) {
      miniBck = `${await BiliHandler.getTempCk()}DedeUserID=401742377;`
    } else {
      miniBck = localCk
    }
    const cookie = { 'cookie': `${miniBck}`, }
    const response = await fetch(url, {
      method: "GET",
      headers: lodash.merge(_headers, cookie),
      redirect: "follow",
    });
    return response;
  }

  async upTask() {
    let setData = xxCfg.getConfig("bilibili", "set");
    let pushData = xxCfg.getConfig("bilibili", "push");

    // 推送2小时内的B站动态
    let interval = 7200;

    // 存放直播状态信息
    let lastLiveStatusInfo = {};

    let lastTemp = await redis.get("xianxin:bililive:lastlivestatus");

    if (lastTemp) {
      lastLiveStatusInfo = JSON.parse(lastTemp);
    }

    const uidMap = new Map();

    // 存放获取的所有动态 key为uid value为数组
    const dynamicList = {};
    for (let key in pushData) {
      const ups = pushData[key] || [];
      for (let up of ups) {
        if (!lastTemp) {
          lastLiveStatusInfo[`${up.uid}`] = 0;
        }

        const response = await this.getBilibiliDynamicInfo(up.uid);

        if (response) {
          const res = response
          if (res.code == 0) {
            const dynamicData = res?.data?.items || [];
            dynamicList[up.uid] = dynamicData;
          }
        }
        uidMap.set(up.uid, {
          groupIds: Array.from(
            new Set([
              ...((uidMap.get(up.uid) && uidMap.get(up.uid).groupIds) || []),
              key,
            ])
          ),
          upName: up.name,
          type: up.type || [],
        });

        await common.sleep(2000);
      }
    }

    let now = Date.now() / 1000;

    this.key = "Yz:xianxin:bilibili:upPush:";

    Bot.logger?.mark("xianxin插件：B站动态定时检测");

    for (let [key, value] of uidMap) {
      // const accInfoRes = await this.getBilibiliUserInfo(key);

      const tempDynamicList = dynamicList[key] || [];

      const willPushDynamicList = [];

      for (let dynamicItem of tempDynamicList) {
        let author = dynamicItem?.modules?.module_author || {};
        if (!author?.pub_ts) continue;
        /** 不满足时间的不放入待推送动态 */
        if (Number(now - author.pub_ts) > interval) {
          continue;
        }
        /** 不放入直播的动态，直接走新接口 */
        // if (dynamicItem.type == "DYNAMIC_TYPE_LIVE_RCMD") {
        //   continue;
        // }
        /** 如果关闭了转发动态不推送, 那么直接在这里不放入待推送数据里 */
        if (
          dynamicItem.type == "DYNAMIC_TYPE_FORWARD" &&
          !setData.pushTransmit
        ) {
          continue;
        }
        willPushDynamicList.push(dynamicItem);
      }

      const pushMapInfo = value || {};

      const { groupIds, upName, type } = pushMapInfo;

      // if (accInfoRes.ok) {
      //   const accInfoResJsonData = await accInfoRes.json();

      //   const data = accInfoResJsonData?.data || null;
      //   if (data && data.live_room) {
      //     if (
      //       `${lastLiveStatusInfo[key] || 0}${data.live_room.liveStatus}` ==
      //       "01"
      //     ) {
      //       willPushDynamicList.push({
      //         id_str: `${new Date().getTime()}`,
      //         type: "DYNAMIC_TYPE_LIVE_RCMD",
      //         title: data.live_room.title,
      //         url: this.formatUrl(data.live_room.url),
      //         cover: data.live_room.cover,
      //         name: data.name,
      //         face: data.face,
      //       });
      //     }
      //     lastLiveStatusInfo[key] = data.live_room.liveStatus;

      //     await redis.set(
      //       "xianxin:bililive:lastlivestatus",
      //       JSON.stringify(lastLiveStatusInfo),
      //       { EX: 60 * 60 }
      //     );
      //   }
      // }

      for (let pushDynamicData of willPushDynamicList) {
        if (groupIds && groupIds.length) {
          for (let groupId of groupIds) {
            /** 如果禁用了type那么不发送指令 */
            if (type && type.length && !type.includes(pushDynamicData.type)) {
              continue;
            }

            await this.sendDynamic(groupId, upName, pushDynamicData, setData);
          }
        }
      }
      await common.sleep(1000);
    }
  }

  // 推送消息失败重试
  // async pushAgain(groupId, msg) {
  //   await common.sleep(5000);
  //   Bot.pickGroup(groupId)
  //     .sendMsg(msg)
  //     .catch((err) => {
  //       logger.error(`群[${groupId}]第二次推送失败：${JSON.stringify(err)}`);
  //     });

  //   return;
  // }

  async sendDynamic(groupId, upName, pushDynamicData, setData) {
    const id_str = pushDynamicData.id_str;

    let sended = await redis.get(`${this.key}${groupId}:${id_str}`);
    if (sended) return;

    this.e.group = Bot.pickGroup(String(groupId));

    if (!!setData.pushMsgMode) {
      const data = this.dynamicDataHandle(pushDynamicData);
      // 包含关键字不推送
      let banWords = eval(`/${setData.banWords.join("|")}/g`);
      if (new RegExp(banWords).test(`${data.data.title}${data.data.content}`)) {
        return "return";
      }

      if (!this[id_str]) {
        const dynamicMsg = await this.render(data);
        const img = dynamicMsg;

        this[id_str] = {
          img: img,
        };
      }

      redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 });

      Bot.logger?.mark("xianxin插件：B站动态执行推送");

      /*QQ频道午夜时间推送有限制，会报错code: 304022*/
      const images = Array.from(this[id_str].img, item => ({ ...item }));
      for (let i = 0; i < images.length; i++) {
        await this.e.group
          .sendMsg(images[i])
          .catch((err) => {
            Bot.logger?.mark(`群/子频道[${groupId}]推送失败：${JSON.stringify(err)}`);
          });
      }
      await common.sleep(1000);
    } else {
      const dynamicMsg = this.buildDynamic(
        upName,
        pushDynamicData,
        false,
        setData
      );

      redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 });

      if (dynamicMsg == "continue") {
        return "return";
      }

      // 包含关键字不推送
      let banWords = eval(`/${setData.banWords.join("|")}/g`);
      if (new RegExp(banWords).test(dynamicMsg.join(""))) {
        return "return";
      }
      await this.e.group.sendMsg(dynamicMsg);
      await common.sleep(1000);
    }
  }

  dynamicDataHandle = (data) => {
    const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/";
    let desc,
      pics = [];
    let dynamic = { data: {} };

    let author = data?.modules?.module_author || {};

    dynamic.data.face = author.face;
    dynamic.data.name = author.name;

    dynamic.data.pendant = author?.pendant?.image || data?.pendant?.image;

    dynamic.data.created = moment().format("YYYY年MM月DD日 HH:mm:ss");

    dynamic.data.type = data.type;
    if (data.type == "DYNAMIC_TYPE_AV") {
      desc = data?.modules?.module_dynamic?.major?.archive || {};
      dynamic.data.title = desc.title;
      dynamic.data.content = desc.desc;
      dynamic.data.url = this.formatUrl(desc.jump_url);
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.category = "视频动态";
      dynamic.data.pics = [desc.cover];
    } else if (data.type == "DYNAMIC_TYPE_WORD") {
      desc = data?.modules?.module_dynamic?.desc || {};
      dynamic.data.title = "";
      dynamic.data.content = desc.text;
      dynamic.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.pics = [];
      dynamic.data.category = "图文动态";
    } else if (data.type == "DYNAMIC_TYPE_DRAW") {
      desc = data?.modules?.module_dynamic?.desc || {};
      pics = data?.modules?.module_dynamic?.major?.draw?.items || [];
      pics = pics.map((item) => {
        return item.src;
      });
      dynamic.data.title = "";
      dynamic.data.content = desc.text;
      dynamic.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.pics = pics;
      dynamic.data.category = "图文动态";
    } else if (data.type == "DYNAMIC_TYPE_ARTICLE") {
      desc = data?.modules?.module_dynamic?.major?.article || {};
      if (desc.covers && desc.covers.length) {
        pics = desc.covers;
      }
      dynamic.data.title = desc.title;
      dynamic.data.content = "";
      dynamic.data.url = this.formatUrl(desc.jump_url);
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.pics = pics;
      dynamic.data.category = "文章动态";
    } else if (data.type == "DYNAMIC_TYPE_FORWARD") {
      desc = data?.modules?.module_dynamic?.desc || {};
      dynamic.data.title = "";
      dynamic.data.content = desc.text;
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
      dynamic.data.pics = [data.cover];
      dynamic.data.orig = this.dynamicDataHandle(data.orig);
      dynamic.data.category = "转发动态";
    } else if (data.type == "DYNAMIC_TYPE_LIVE_RCMD") {
      desc = data?.modules?.module_dynamic?.major?.live_rcmd?.content;
      if (!desc) return;
      desc = JSON.parse(desc);
      desc = desc?.live_play_info;
      if (!desc) return;
      dynamic.data.title = desc.title;
      dynamic.data.content = "";
      dynamic.data.pubTime = "";
      dynamic.data.pubTs = "";
      dynamic.data.url = desc.link;
      dynamic.data.pics = [desc.cover];
      dynamic.data.category = "直播动态";
    }

    return {
      ...this.screenData,
      saveId: data.id_str,
      ...dynamic,
    };
  };

  /**
   * 处理b站动态页图片生成
   * @param {object} param
   * @returns {img: string[], code: string}
   */
  async render(param) {
    return await puppeteer.screenshots(this.model, param)
  }

  // 生成动态消息文字内容
  buildDynamic(upName, dynamic, isForward, setData) {
    const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/";
    let desc, msg, pics, author;
    let title = `B站【${upName}】动态推送：\n`;

    switch (dynamic.type) {
      case "DYNAMIC_TYPE_AV":
        desc = dynamic?.modules?.module_dynamic?.major?.archive;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;

        title = `B站【${upName}】视频动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `标题：${desc.title}\n`,
          `${desc.desc}\n`,
          `链接：${this.formatUrl(desc.jump_url)}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          segment.image(desc.cover),
        ];

        return msg;
      case "DYNAMIC_TYPE_WORD":
        desc = dynamic?.modules?.module_dynamic?.desc;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;

        title = `B站【${upName}】动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `内容：${this.dynamicContentLimit(desc.text, setData)}\n`,
          `链接：${BiliDrawDynamicLinkUrl}${dynamic.id_str}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }`,
        ];

        return msg;
      case "DYNAMIC_TYPE_DRAW":
        desc = dynamic?.modules?.module_dynamic?.desc;
        pics = dynamic?.modules?.module_dynamic?.major?.draw?.items;
        author = dynamic?.modules?.module_author;
        if (!desc && !pics && !author) return;

        const dynamicPicCountLimit = setData.pushPicCountLimit || 3;

        if (pics.length > dynamicPicCountLimit)
          pics.length = dynamicPicCountLimit;

        pics = pics.map((item) => {
          return segment.image(item.src);
        });

        title = `B站【${upName}】图文动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `${this.dynamicContentLimit(desc.text, setData)}\n`,
          `链接：${BiliDrawDynamicLinkUrl}${dynamic.id_str}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          ...pics,
        ];

        return msg;
      case "DYNAMIC_TYPE_ARTICLE":
        desc = dynamic?.modules?.module_dynamic?.major?.article;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;

        pics = [];
        if (desc.covers && desc.covers.length) {
          pics = desc.covers.map((item) => {
            return segment.image(item);
          });
        }

        title = `B站【${upName}】文章动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `标题：${desc.title}\n`,
          `链接：${this.formatUrl(desc.jump_url)}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          ...pics,
        ];

        return msg;
      case "DYNAMIC_TYPE_FORWARD":
        desc = dynamic?.modules?.module_dynamic?.desc;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;
        if (!dynamic.orig) return;

        let orig = this.buildDynamic(upName, dynamic.orig, true, setData);
        if (orig && orig.length) {
          orig = orig.slice(2);
        } else {
          return false;
        }

        title = `B站【${upName}】转发动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `${this.dynamicContentLimit(desc.text, setData)}\n`,
          `链接：${BiliDrawDynamicLinkUrl}${dynamic.id_str}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          "\n---以下为转发内容---\n",
          ...orig,
        ];

        return msg;
      case "DYNAMIC_TYPE_LIVE_RCMD":
        desc = dynamic?.modules?.module_dynamic?.major?.live_rcmd?.content;
        if (!desc) return;
        desc = JSON.parse(desc);
        desc = desc?.live_play_info;
        if (!desc) return;
        title = `B站【${upName}】直播动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `标题：${desc.title}\n`,
          `链接：${desc.link}\n`,
          segment.image(desc.cover),
        ];

        return msg;
      default:
        Bot.logger?.mark(`未处理的B站推送【${upName}】：${dynamic.type}`);
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