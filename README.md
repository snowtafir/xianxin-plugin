<p align="center">
  <a href="https://gitee.com/xianxincoder/xianxin-plugin">
    <img width="200" src="https://gitee.com/xianxincoder/xianxin-plugin/raw/master/resources/img/rank/top.png">
  </a>
</p>

<h1 align="center">适配TRSS-Yunzai的xianxin-plugin</h1>

<div align="center">

是 <a href="https://gitee.com/Le-niao/Yunzai-Bot" target="_blank">TRSS-Yunzai</a> 关于原神cos、B站推送、wiki查询和群战等功能的扩展插件

[![访问量](https://profile-counter.glitch.me/xianxin-plugin/count.svg)](https://gitee.com/xianxincoder/xianxin-plugin)


<img src="https://cdn.jsdelivr.net/gh/xianxincoder/xianxincoder/assets/github-contribution-grid-snake.svg">

</div>
<br />
<br />

## 📦 安装与更新与配置

推荐使用 git 进行安装，以方便后续升级。在[Yunzai-Bot](https://gitee.com/Le-niao/Yunzai-Bot)根目录打开终端，运行如下命令进行安装。

```base
git clone https://gitee.com/snowtafir/xianxin-plugin.git ./plugins/xianxin-plugin/
```
### B站推送 使用前配置
自 2023 年三月起，B站风控升级，为保证旅行者们的使用体验，目前需要配置使用自己的B站cookie增加稳定性。

目前插件已支持配置自定义Cookie，请在私聊Bot下发送`#绑定B站ck: xxx`进行添加自己本地浏览器登录b站后获取到的B站cookie，其中`xxx`请替换为自己获取到的cookie。

添加的cookie会自动新建并保存于`Yunzai/data/BilibiliCookie/Bili_Ck.yaml`，如需更换/更新cookie 使用新的cookie发送`#绑定B站ck: xxx`覆盖绑定即可。

* cookie的获取与设置：
1. 在浏览器中登录自己的b站账号
2. 处于bilibili首页 -> 在网页空白处右键 -> 检查（即打开开发工具） -> 找到调试台 -> 在下方输入document.cookie并回车 -> 复制给到的cookie文本
3. 私聊Bot下发送`#绑定B站ck: xxx`进行添加，提示添加成功即可愉快使用。

## ⌨️ 功能可用状态
* 以下可用功能QQ频道可用

- [x] 米游社功能
- [x] B站功能
- [x] 群战
- [x] 五子棋
- [x] 21点
- [x] 给我点颜色看看
- [x] 其他指令
- [x] 神秘指令
- [ ] 赞我/转发等小功能，请自测
- [ ] 任意功能

## ✨ 功能指令

| 命令 | 🌰 |
| --- | --- |
| 米游社功能 | ` #cos 角色名 ` - 指定角色随机查看cos图片<br/>` #cos #cos1 #cos详情 ` - 查看米游社中cos榜<br/>` #攻略 xxx ` - 查询原神精选的玩家攻略内容<br/>` #wiki xxx ` - 查询原神wiki的内容<br/>` #cosdby #cosdby1 #cosdby详情 ` - 查看米游社中大别野cos榜<br/>` #同人 #同人1 #同人详情 ` - 查看米游社中同人榜<br/>` #热门话题 ` - 查看米游社中热聊话题 |
| B站功能 | ` #订阅up推送 UID #订阅up推送 直播 UID ` - 检测up的B站动态进行推送<br/>` #取消up推送 UID #取消up推送 直播 UID ` - 删除对应up的B站对应动态推送<br/>` #推送up列表 ` - 查看本群添加的up推送列表<br/>` #手动推送up ` - 手动触发定时推送任务<br/>` #搜索up xxx ` - 根据昵称在b站搜索up<br/>` #绑定B站ck: xxx ` - 为B站动态推送配置ck,若ck缺失则功能不可用,仅限私聊<br/>` #我的B站ck ` - 查看配置的B站ck,仅限私聊<br/>` #验证B站ck ` - 验证绑定的B站ck是否有效<br/>` #B站ck帮助 ` - 查看B站ck帮助 |
| 群战 | ` #加入群战 #群战信息 ` - 初始化群战信息<br/>` #战宝 ` - 战胜战宝获得双倍战力<br/>` 战@群友 #战@群友 ` - @一名群友进行群战<br/>` 狂战@群友 #狂战@群友 ` - 战狂(战斗次数最多)的专属技能<br/>` #逆天改命 ` - 战力最低的专属技能<br/>` #战榜 ` - 查看群战rank榜<br/>` #战狂榜 ` - 查看战斗次数排行榜<br/>` #摆烂榜 ` - 查看战力倒数排行榜 |
| 五子棋 | ` #五子棋 ` - 开局五子棋游戏<br/>` 落子+字母+数字 落子H8 ` - 五子棋落子<br/>` #弃子 ` - 五子棋认输 |
| 21点 | ` #21点 ` - 开局21点游戏<br/>` 叫牌 ` - 21点叫牌<br/>` 停牌 ` - 停止叫牌 |
| 给我点颜色看看 | ` #给我点颜色看看 ` - 开局给我点颜色看看游戏<br/>` 块+数字 ` - 选中某个不同的色块 |
| 闲心小工具 | ` #赞我 ` - QQ名片点赞<br/>` 神秘指令 ` - 情绪激动时易触发 |
| 云崽菜单辅助 | ` #任意功能 ` 如果不存在但是有类似的功能将会联想提示 |
| 其他指令 | ` #闲心插件版本 ` - 查看最近维护的版本信息<br/>` #闲心插件更新 ` - 进行更新闲心插件<br/>` #闲心插件强制更新 ` - 进行强制更新闲心插件 |


## 🖥 依赖

- [TRSS-Yunzai v3](https://gitee.com/TimeRainStarSky/Yunzai)
或
- [Miao-Yunzai v3](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)

## ⌨️ todo
- [x] 基本适配TRSS-Yunzai
- [ ] 偶尔维护


## 🌈 其他
- 素材来源于网络，仅供交流学习使用
- 严禁用于任何商业用途和非法行为
- 如果对你有帮助辛苦给个star，这是对我最大的鼓励


## 🔗 链接
- [原版xianxin-plugin](https://gitee.com/xianxincoder/xianxin-plugin)
- [云崽](https://gitee.com/Le-niao/Yunzai-Bot)
- [插件库](https://gitee.com/Hikari666/Yunzai-Bot-plugins-index)
