import moment from "moment";
import xxCfg from "../model/xxCfg.js";
import base from "./base.js";
import { puppeteerRender } from "../components/puppeteerRender.js";
import fetch from "node-fetch";
import common from "../../../lib/common/common.js";
import lodash from 'lodash';
import { getWbiSign, getDmImg } from "../util/BiliWbi.js";
import { API, BILIBILI_HEADERS, getNewTempCk, synCookie, appendUrlQueryParams, postExClimbWuzhi, readTempCk, restart } from "../util/BiliApi.js"

export default class Bilibili extends base {
  constructor(e) {
    super(e);
    this.model = "bilibili";
  }

  async getBilibiliUserInfo(uid) {
    let UserInfoApiUrl = API.biliSpaceUserInfo;
    let parama = {
      mid: uid,
      jsonp: 'jsonp',
    }
    let url = appendUrlQueryParams(UserInfoApiUrl, parama);
    let ckCheck = await synCookie();

    if (ckCheck.mark == '"ckIsEmpty"') {
      await getNewTempCk();
    }

    let { cookie, mark } = await synCookie(); // 获取 cookie 和 mark
    const response = await fetch(url, {
      method: "GET",
      headers: lodash.merge(BILIBILI_HEADERS, { "Cookie": `${cookie}` }),
      redirect: "follow",
    });
    return response;
  }

  async getBilibiliDynamicInfo(uid) {
    let DynamicApiUrl = API.biliDynamicInfoList;
    let parama = {
      host_mid: uid,
      //timezone_offset: -480,
      //platform: "web",
      //features: "itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote",
      //web_location: "333.999",
      //"x-bili-device-req-json":{"platform":"web","device":"pc"},
      //"x-bili-web-req-json":{"spm_id":"333.999"},
      //dm_img_str:"V2ViR0wgMS",
      //dm_img_list:[],
      //dm_img_inter:{ds:[], wh:[0,0,0],of:[0,0,0]},
     // dm_cover_img_str:"QU5HTEUgKEludGVsLCBJbnRlbChSKSBIRCBHcmFwaGljcyBEaXJlY3QzRDExIHZzXzVfMCBwc181XzApLCBvciBzaW1pbGFyR29vZ2xlIEluYy4gKEludGVsKQ"
    }
    let url = appendUrlQueryParams(DynamicApiUrl, parama);
    let { cookie, mark } = await synCookie();
    let fetchGetHeaders = lodash.merge(BILIBILI_HEADERS, { 'Cookie': `${cookie}`, 'Host': `api.bilibili.com`, 'Origin': 'https://www.bilibili.com', 'Referer': `https://www.bilibili.com/`, });
    //const { wts, w_rid } = await getWbiSign(parama, fetchGetHeaders);
    //let url = DynamicApiUrl + `?host_mid=${uid}&timezone_offset=-480&platform=web&features=itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote&web_location=333.999&dm_img_list=[]&dm_img_str=V2ViR0wgMS&dm_cover_img_str=QU5HTEUgKEludGVsLCBJbnRlbChSKSBIRCBHcmFwaGljcyBEaXJlY3QzRDExIHZzXzVfMCBwc181XzApLCBvciBzaW1pbGFyR29vZ2xlIEluYy4gKEludGVsKQ&dm_img_inter={"ds":[],"wh":[0,0,0],"of":[0,0,0]}&x-bili-device-req-json={"platform":"web","device":"pc"}&x-bili-web-req-json={"spm_id":"333.999"}&w_rid=${w_rid}&wts=${wts}`
    let setData = xxCfg.getConfig("bilibili", "set");
    let resData;

    /**fetch()获取动态列表*/
    async function getDynamicInfoList() {
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (10500 - 2000 + 1) + 2000)));
      const response = await fetch(url, { method: "GET", headers: fetchGetHeaders, redirect: "follow", });
      let resData = response.json();
      return resData;
    }

    /**Post校验ExC+获取动态列表数据*/
    async function postExCfetchGetAction() {
      const result = await postExClimbWuzhi(cookie);
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 1000)));
      const data = await result.json();
      const dataCode = data.code;

      if (dataCode !== 0) {
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：B站动态ExC接口校验失败：${JSON.stringify(data)}`);
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：尝试获取B站动态`);
        resData = await getDynamicInfoList();
      } else if (dataCode === 0) {
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：B站动态ExC接口校验成功：${JSON.stringify(data)}`);
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：再次尝试获取B站动态`);
        resData = await getDynamicInfoList();
      }
      return resData;
    }

    /**获取动态列表数据*/
    async function fetchGetAction() {

      resData = await getDynamicInfoList();

      if (!resData || resData.code !== 0) {
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：获取B站动态：遭遇风控，失败`);
        resData = await postExCfetchGetAction();
      }
      return resData;
    }

    async function tempCkAutoFlashModeFetch() {
      resData = await getDynamicInfoList();
      tempCkStatuTTL = await redis.ttl(TempCkStatuKey);
      tempCkStatu = parseInt(tempCkStatu) + 1;
      await redis.set(TempCkStatuKey, tempCkStatu, { EX: tempCkStatuTTL });

      if (!resData || resData.code !== 0) {
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：tempCkAutoFlashModeFetch：遭遇风控，失败`);
        await getNewTempCk();
        await redis.set(TempCkStatuKey, 1, { EX: 3600 * 24 * 2 });

        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 1000)));
        resData = await postExCfetchGetAction();

        tempCkStatuTTL = await redis.ttl(TempCkStatuKey);
        tempCkStatu = parseInt(tempCkStatu) + 1;
        await redis.set(TempCkStatuKey, tempCkStatu, { EX: tempCkStatuTTL });

      }
      return resData;
    }

    const TempCkStatuKey = "Yz:xianxin:bilibili:biliTempCkStatu";
    const tempCkKey = "Yz:xianxin:bilibili:biliTempCookie";
    let tempCkTTL, tempCkStatu, tempCkStatuTTL;

    /**是否开启自动刷新tempCk，默认关闭*/
    let tempCkAutoFlash = !!setData.tempCkAutoFlash === true ? true : false;

    (logger ?? Bot.logger)?.mark(`trss-xianxin插件：B站功能当前使用：${mark}`);

    switch (mark) {
      case 'loginCk':
        resData = await fetchGetAction();
        break;
      case 'localCk':
        resData = await fetchGetAction();
        break;
      case 'tempCk':
        tempCkTTL = await redis.ttl(tempCkKey);
        tempCkStatu = await redis.get(TempCkStatuKey);

        if (!tempCkStatu) {
          await redis.set(TempCkStatuKey, 1, { EX: 3600 * 24 * 2 });
        }

        if (tempCkTTL < 3600 * 24 * 28) {

          if (tempCkAutoFlash == true) {
            resData = await tempCkAutoFlashModeFetch();

          } else if (tempCkAutoFlash == false) {

            resData = await fetchGetAction();

            tempCkStatuTTL = await redis.ttl(TempCkStatuKey);
            tempCkStatu = parseInt(tempCkStatu) + 1;
            await redis.set(TempCkStatuKey, tempCkStatu, { EX: tempCkStatuTTL });
          }

        } else if (tempCkTTL >= 3600 * 24 * 28) {

          if (tempCkAutoFlash == true) {
            if (tempCkStatu > 180) {
              resData = await tempCkAutoFlashModeFetch();

            } else {
              resData = await fetchGetAction();
            }
          } else if (tempCkAutoFlash == false) {
            resData = await fetchGetAction();
          }
        }
    }
    if (!resData || resData.code !== 0) {
      (logger ?? Bot.logger)?.warn(`trss-xianxin插件：Dynamic_err：${JSON.stringify(resData)}`);
    }
    return resData;
  }

  async getBilibiliUp(keyword) {
    let biliSearchUp = API.biliSearchUp;
    let parama = { keyword: keyword, page: 1, search_type: 'bili_user', order: 'totalrank', pagesize: 5 }
    let url = appendUrlQueryParams(biliSearchUp, parama);

    let ckCheck = await synCookie();

    if (ckCheck.mark == '"ckIsEmpty"') {
      await getNewTempCk();
    }

    let { cookie, mark } = await synCookie(); // 获取 cookie 和 mark
    const response = await fetch(url, {
      method: "GET",
      headers: lodash.merge(BILIBILI_HEADERS, { 'Cookie': `${cookie}` },),
      redirect: "follow",
    });
    return response;
  }

  /*动态检测与推送流程任务*/
  async upTask() {
    let setData = xxCfg.getConfig("bilibili", "set"); // 获取配置项 set
    let pushData = xxCfg.getConfig("bilibili", "push"); // 获取配置项 push
    const interval = 7200; // 推送时间间隔为2小时
    let lastLiveStatusInfo = JSON.parse(await redis.get("xianxin:bililive:lastlivestatus")) || {}; // 获取直播状态信息
    const uidMap = new Map(); // 存放 uid 与推送信息的映射
    const dynamicList = {}; // 存放获取的所有动态，键为 uid，值为动态数组

    // 遍历 pushData 对象
    for (let key in pushData) {
      const ups = pushData[key] || []; // 获取当前 key 对应的 up 数组
      for (let up of ups) {
        // 初始化直播状态信息
        if (!lastLiveStatusInfo[up.uid]) {
          lastLiveStatusInfo[up.uid] = 0;
        }

        // 获取 uid 对应的动态信息
        const response = await this.getBilibiliDynamicInfo(up.uid);
        if (response && response.code === 0) {
          const dynamicData = response.data?.items || [];
          dynamicList[up.uid] = dynamicData;
        }

        // 构建 uidMap 映射信息
        let groupIds = Array.from(new Set([...((uidMap.get(up.uid) && uidMap.get(up.uid).groupIds) || []), key]));
        let e_self_id = up.e_self_id || [];
        let { name, type } = up;
        uidMap.set(up.uid, { groupIds, e_self_id, upName: name, type });

        await common.sleep(2000); // 休眠2秒
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (4000 - 1000 + 1) + 1000))); // 随机延时1-4秒
      }
    }

    const now = Date.now() / 1000; // 当前时间戳（秒）
    this.key = "Yz:xianxin:bilibili:upPush:"; // 指定 key

    // 遍历 uidMap 映射
    for (let [key, value] of uidMap) {
      const tempDynamicList = dynamicList[key] || []; // 获取当前 uid 对应的动态数组
      const willPushDynamicList = []; // 存放待推送的动态数组

      // 遍历动态数组，筛选出满足条件的动态
      for (let dynamicItem of tempDynamicList) {
        let author = dynamicItem?.modules?.module_author || {};
        if (!author?.pub_ts) continue; // 如果动态没有发布时间，跳过当前循环
        if (Number(now - author.pub_ts) > interval) continue; // 如果超过推送时间间隔，跳过当前循环
        if (dynamicItem.type === "DYNAMIC_TYPE_FORWARD" && !setData.pushTransmit) continue; // 如果关闭了转发动态的推送，跳过当前循环
        willPushDynamicList.push(dynamicItem); // 将满足条件的动态添加到待推送数组
      }

      const pushMapInfo = value || {}; // 获取当前 uid 对应的推送信息

      const { groupIds, e_self_id, upName, type } = pushMapInfo;

      // 遍历待推送的动态数组，发送动态消息
      for (let pushDynamicData of willPushDynamicList) {
        if (groupIds && groupIds.length) {
          for (let groupId of groupIds) {
            if (type && type.length && !type.includes(pushDynamicData.type)) continue; // 如果禁用了某类型的动态推送，跳过当前循环
            await this.sendDynamic(groupId, e_self_id, upName, pushDynamicData, setData); // 发送动态消息
            await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (10500 - 2000 + 1) + 2000))); // 随机延时2-10.5秒
          }
        }
      }
      await common.sleep(1000); // 休眠1秒
    }
  }

  /*发送动态*/
  async sendDynamic(groupId, e_self_id, upName, pushDynamicData, setData) {
    const id_str = pushDynamicData.id_str;

    let sended = await redis.get(`${this.key}${groupId}:${id_str}`);
    if (sended) return; // 如果已经发送过，则直接返回

    const yunzaiName = await xxCfg.getYunzaiName(); // 获取云崽名称

    if (!!setData.pushMsgMode) {
      const data = this.dynamicDataHandle(pushDynamicData); // 处理动态数据
      let banWords = eval(`/${setData.banWords.join("|")}/g`); // 构建屏蔽关键字正则表达式
      if (new RegExp(banWords).test(`${data.data.title}${data.data.content}`)) {
        return "return"; // 如果动态包含屏蔽关键字，则直接返回
      }

      let isSplit = !!setData.isSplit; // 是否启用分片截图，默认为 true
      let style = isSplit ? '.ql-editor { max-height: 100% !important; }' : ''; // 分片截图模式的样式

      if (!this[id_str]) {
        const dynamicMsg = await this.render(data, isSplit, style); // 渲染动态消息
        const { img, code } = dynamicMsg;

        this[id_str] = { img }; // 缓存动态消息的图片数据
      }

      redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 }); // 设置已发送标记

      (logger ?? Bot.logger)?.mark("trss-xianxin插件：B站动态执行推送");

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
      await common.sleep(1000); // 休眠1秒
    } else {
      const dynamicMsg = this.buildDynamic(upName, pushDynamicData, false, setData); // 构建普通动态消息

      redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 }); // 设置已发送标记

      if (dynamicMsg == "continue") {
        return "return"; // 如果动态消息构建失败，则直接返回
      }

      let banWords = eval(`/${setData.banWords.join("|")}/g`); // 构建屏蔽关键字正则表达式
      if (new RegExp(banWords).test(dynamicMsg.join(""))) {
        return "return"; // 如果动态消息包含屏蔽关键字，则直接返回
      }

      let uin = yunzaiName === 'miao-yunzai' ? e_self_id : undefined;
      await (Bot[uin] ?? Bot).pickGroup(String(groupId)).sendMsg(dynamicMsg) // 发送普通动态消息
        .catch((err) => {
          (logger ?? Bot.logger)?.mark(`群/子频道[${groupId}]推送失败：${JSON.stringify(err)}`);
        });
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
      dynamic.data.url = `https:${desc.link}`;
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
   * @param {boolean} isSplit 是否为分片截图：true / false
   * @param {string} style 修改模版渲染后的html中某元素的css样式，传入示例 '.ql-editor { max-height: 100% !important; }'
   * @returns {img: string[], code: string}
   */
  async render(param, isSplit, style) {
    return await puppeteerRender.screenshot(this.model, param, isSplit, style)
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
          `链接：https:${desc.link}\n`,
          segment.image(desc.cover),
        ];

        return msg;
      default:
        (logger ?? Bot.logger)?.mark(`未处理的B站推送【${upName}】：${dynamic.type}`);
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