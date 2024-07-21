import path from "path";
const _path = process.cwd() + "/plugins/trss-xianxin-plugin";
import xxCfg from "./model/xxCfg.js";

/**
 *  支持锅巴配置
 */
export function supportGuoba() {
  return {
    pluginInfo: {
      name: "trss-xianxin-plugin",
      title: "trss-xianxin-plugin",
      author: [
        '@闲心',
        '@snowtafir',
      ],
      authorLink: [
        'https://gitee.com/xianxincoder',
        'https://gitee.com/snowtafir',
      ],
      link: "https://gitee.com/snowtafir/xianxin-plugin.git",
      isV3: true,
      isV2: false,
      description: "微博推送/B站推送/cos/米游社等 功能的拓展插件。基于 xianxin-plugin 维护的trss分支。当前适配TRSS-Yunzai、Miao-Yunzai。部分功能不可用。",
      // 显示图标，此为个性化配置
      // 图标可在 https://icon-sets.iconify.design 这里进行搜索
      icon: "mdi:stove",
      // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
      iconColor: "#d19f56",
      // 如果想要显示成图片，也可以填写图标路径（绝对路径）
      iconPath: path.join(_path, "resources/img/rank/top.png"),
    },
    // 配置项信息
    configInfo: {
      // 配置项 schemas
      // 功能配置项
      schemas: [{
          component: 'Divider',
          label: 'B站推送设置'
        },
        {
          field: "bilibili.pushStatus",
          label: "B站推送状态",
          bottomHelpMessage: "B站推送任务状态",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "不推送", value: 0 },
              { label: "推送", value: 1 },
            ],
            placeholder: "请选择B站推送状态",
          },
        },
        {
          field: "bilibili.pushTime",
          label: "B站定时任务",
          bottomHelpMessage: "检测b站推送定时任务，Cron表达式，作用域共6位，具体方法浏览器搜索 “node-schedule cron表达式",
          component: "EasyCron",
          required: true,
          componentProps: {
            placeholder: "请输入检测b站推送定时任务",
          },
        },
        {
          field: "bilibili.pushTransmit",
          label: "推送转发动态",
          bottomHelpMessage: "推送转发动态设置",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "不推送", value: 0 },
              { label: "推送", value: 1 },
            ],
            placeholder: "请选择推送转发动态设置",
          },
        },
        {
          field: "bilibili.pushMsgMode",
          label: "B站推送消息模式",
          bottomHelpMessage: "设置B站动态推送消息模式",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "文字模式", value: 0 },
              { label: "图片模式", value: 1 },
            ],
            placeholder: "请选择B站动态推送消息模式",
          },
        },
        {
          field: "bilibili.isSplit",
          label: "B站推送分片截图模式",
          bottomHelpMessage: "设置B站动态推分片截图模式，仅分片截图模式下才会推送全部长动态，默认开启",
          component: "Select",
          componentProps: {
            options: [
              { label: "关闭分片截图", value: 0 },
              { label: "开启分片截图", value: 1 },
            ],
            placeholder: "请选择是否开启B站动态分片截图模式",
          },
        },
        {
          component: 'Divider',
          label: '微博推送设置'
        },
        {
          field: "weibo.pushStatus",
          label: "微博推送状态",
          bottomHelpMessage: "微博推送任务状态",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "不推送", value: 0 },
              { label: "推送", value: 1 },
            ],
            placeholder: "请选择微博推送状态",
          },
        },
        {
          field: "weibo.pushTime",
          label: "微博定时任务",
          bottomHelpMessage: "检测微博推送定时任务，Cron表达式，作用域共6位，具体方法浏览器搜索 “node-schedule cron表达式",
          component: "EasyCron",
          required: true,
          componentProps: {
            placeholder: "请输入检测微博推送定时任务",
          },
        },
        {
          field: "weibo.pushTransmit",
          label: "推送转发动态",
          bottomHelpMessage: "推送转发动态设置",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "不推送", value: 0 },
              { label: "推送", value: 1 },
            ],
            placeholder: "请选择推送转发动态设置",
          },
        },
        {
          field: "weibo.pushMsgMode",
          label: "微博推送消息模式",
          bottomHelpMessage: "设置微博动态推送消息模式",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "文字模式", value: 0 },
              { label: "图片模式", value: 1 },
            ],
            placeholder: "请选择微博动态推送消息模式",
          },
        },
        {
          field: "weibo.isSplit",
          label: "微博推送分片截图模式",
          bottomHelpMessage: "设置微博动态推分片截图模式，仅分片截图模式下才会推送全部长动态，默认开启",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "关闭分片截图", value: 0 },
              { label: "开启分片截图", value: 1 },
            ],
            placeholder: "请选择是否开启微博动态分片截图模式",
          },
        },
        {
          component: 'Divider',
          label: '神秘指令设置'
        },
        {
          field: "mystery.permission",
          label: "woc权限",
          bottomHelpMessage: "设置woc权限",
          component: "Select",
          componentProps: {
            options: [
              { label: "所有人", value: "all" },
              { label: "主人", value: "master" },
              { label: "群主", value: "owner" },
              { label: "管理员", value: "admin" },
            ],
            placeholder: "请选择设置woc权限",
          },
        },
        {
          field: "mystery.status",
          label: "woc是否启用",
          bottomHelpMessage: "woc启用开关",
          component: "Select",
          componentProps: {
            options: [
              { label: "开启", value: 1 },
              { label: "关闭", value: 0 },
            ],
            placeholder: "请选择设置woc是否开启",
          },
        },
        {
          field: "mystery.forwarder",
          label: "转发谁的消息",
          bottomHelpMessage: "转发的消息中 谁发的消息",
          component: "Select",
          componentProps: {
            options: [
              { label: "触发该命令的人", value: "replyer" },
              { label: "机器人", value: "bot" },
            ],
            placeholder: "转发的消息中 谁发的消息",
          },
        },
        {
          field: "mystery.delMsg",
          label: "woc撤回时间",
          bottomHelpMessage: "自动撤回消息时间，单位秒， 0:不撤回",
          component: "InputNumber",
          componentProps: {
            min: 0,
            max: 65535,
            placeholder: "请输入自动撤回消息时间",
          },
        },
        {
          field: "mystery.wocUrl",
          label: "woc源地址",
          bottomHelpMessage: "自助换图片源，理论上支持市面上的图片接口",
          component: "Input",
          componentProps: {
            placeholder: "请输入woc源地址",
          },
        },
        {
          field: "mystery.imageCountLimit",
          label: "woc图片数限制",
          bottomHelpMessage: "限制图片数量",
          component: "InputNumber",
          componentProps: {
            min: 0,
            max: 100,
            placeholder: "请输入限制图片数量",
          },
        },
        {
          component: 'Divider',
          label: '米游社功能设置'
        },
        {
          field: "mys.wikiMode",
          label: "wiki消息模式",
          bottomHelpMessage: "设置wiki消息模式",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "图片模式", value: 0 },
              { label: "文字模式", value: 1 },
            ],
            placeholder: "设置wiki消息模式",
          },
        },
        {
          field: "mys.strategyMode",
          label: "攻略消息模式",
          bottomHelpMessage: "设置攻略消息模式",
          component: "Select",
          componentProps: {
            options: [
              { label: "图片模式", value: 0 },
              { label: "文字模式", value: 1 },
              { label: "分片式图片模式", value: 2 },
            ],
            placeholder: "设置攻略消息模式",
          },
        },
        {
          component: 'Divider',
          label: '群战设置'
        },
        {
          field: "game.limitTimes",
          label: "群战次数限制",
          bottomHelpMessage: "每人每天最多战斗次数",
          component: "InputNumber",
          componentProps: {
            min: 1,
            max: 65535,
            placeholder: "请输入群战次数限制",
          },
        },
        {
          field: "game.limitTop",
          label: "群战Top人数",
          bottomHelpMessage: "展示排行榜人数",
          component: "InputNumber",
          componentProps: {
            min: 1,
            max: 65535,
            placeholder: "群战Top人数",
          },
        },
      ],
    // 获取配置数据方法（用于前端填充显示数据）
    getConfigData() {
      const models = ["bilibili", "weibo", "game", "mys", "mystery"]; //要配置cofig的功能
      const data = {};
      for (let model of models) {
        data[model] = xxCfg.getConfig(model, "set");
      }
      return data;
    },

    // 设置配置的方法（前端点确定后调用的方法）
    setConfigData(data, { Result }) {
      const models = ["bilibili", "weibo", "game", "mys", "mystery"]; //要配置cofig的功能
      const mergedData = {};
      for (let model of models) {
        mergedData[model] = xxCfg.getConfig(model, "set");
      }

      const setedData = {};
      for (let model of models) {
        setedData[model] = {};
      }
      
      //保留未设定值的配置项
      for (let model of models) {
        for (let key in mergedData[model]) {
          if (typeof data[`${model}.${key}`] != "undefined") {
            setedData[model][key] = data[`${model}.${key}`];
          } else {
            setedData[model][key] = mergedData[model][key];
          }
        }
      }
      //保存配置
      for (let model of models) {
        xxCfg.saveSet(model, "set", "config", {
          ...mergedData[model],
          ...setedData[model],
        });
      }
        return Result.ok({}, "保存成功~");
      },
    },
  };
}