import { getPuppeteer } from "./getPuppeteer.js";
import lodash from 'lodash';
import common from "../../../lib/common/common.js";
const _path = process.cwd();

class puppeteerRender {
    /**
     * 处理截图生成
     * @param {string} name 模块名称
     * @param {object} param 传入资源数据
     * @param {boolean} isSplit 是否为分片截图：true / false
     * @param {string} style 修改模版渲染后的html中某元素的css样式，传入示例 '.ql-editor { max-height: 100% !important; overflow-x: hidden; }'
     * @param {object} header 添加puppeteer渲染时网络资源获取请求头，例如：{ 'referer': 'https://example.com' }
     * @param param.imgType  screenshot参数，生成图片类型：jpeg，png
     * @param param.quality  screenshot参数，图片质量 0-100，jpeg是可传，默认90
     * @param param.multiPageHeight 分页状态下页面高度，默认8000
     * @param param.pageGotoParams 页面goto时的参数
     * @returns {img: string[], code: string}
     */
    static async screenshot(name, param, isSplit, style, header) {

        let pageHeight = param.multiPageHeight || 8000;

        const puppeteer = await getPuppeteer(); // 获取 Puppeteer 实例

        await puppeteer.browserInit(); // 初始化 Puppeteer 浏览器

        if (!puppeteer.browser) return false; // 如果浏览器实例不存在，则返回 false

        const savePath = puppeteer.dealTpl(name, param); // 根据参数生成保存路径

        if (!savePath) return false; // 如果保存路径不存在，则返回 false

        let buff = ''
        let start = Date.now()

        let ret = []
        this.shoting = []
        this.shoting.push(name); // 将当前截图任务名称添加到队列中

        try {
            const page = await puppeteer.browser.newPage(); // 创建新页面
            let pageGotoParams = lodash.extend({ timeout: 120000 }, param.pageGotoParams || {});
            // 设置请求 Header
            if (header && (header.length !== 0)) {
                await page.setExtraHTTPHeaders(header);
            }

            await page.goto(`file://${_path}${lodash.trim(savePath, '.')}`, pageGotoParams); // 跳转到指定页面

            // 根据 style 的值来修改 CSS 样式
            if (style && (style.length !== 0)) {
                await page.addStyleTag({
                    content: style,
                });
            }
            // 禁止 GIF 动图播放
            await page.addStyleTag({
                content: `
                  img[src$=".gif"] {
                    animation-play-state: paused !important;
                  }
                `
            });

            const body = (await page.$("#container")) || (await page.$("body")); // 获取页面内容区域的 DOM 元素
            const boundingBox = await body.boundingBox(); // 获取内容区域的边界框信息

            const num = isSplit
                ? Math.ceil(boundingBox.height / pageHeight) // 根据是否需要分片，计算分片数量
                : 1; // 默认为 1

            pageHeight = Math.round(boundingBox.height / num) //动态调整分片高度，防止过短影响观感

            let randData = {
                type: param.imgType || 'jpeg', // 图片类型默认为 JPEG
                quality: param.quality || 90, // 图片质量默认为 90
                path: param.path || '' //
            };

            if (param.imgType === 'png') {
                delete randData.quality;
            }

            if (num > 1) {
                await page.setViewport({
                    width: boundingBox.width,
                    height: pageHeight + 100
                })
            }

            for (let i = 1; i <= num; i++) {
                if (i > 1) {
                    await page.evaluate(pageHeight => {
                        window.scrollBy(0, pageHeight); // 在页面上下文中执行滚动操作
                    }, pageHeight);
                    await common.sleep(300); // 等待一段时间，确保页面加载完成
                }

                const screenshotOptions = {
                    type: randData.type,
                    quality: randData.quality,
                    clip: {
                        x: 0,
                        y: pageHeight * (i - 1), // 根据分片序号计算截图区域的起始位置
                        width: Math.round(boundingBox.width), // 截图区域的宽度与内容区域宽度一致
                        height: Math.min(
                            pageHeight,
                            boundingBox.height - pageHeight * (i - 1)
                        ), // 截图区域的高度取决于内容区域剩余的高度或者默认的分片高度
                    },
                };

                buff = await page.screenshot(screenshotOptions); // 对指定区域进行截图

                puppeteer.renderNum++; // 增加截图次数
                /** 计算图片大小 */
                const kb = (buff.length / 1024).toFixed(2) + "kb"; // 计算图片大小

                logger.mark(`[图片生成][${name}][${puppeteer.renderNum}次] ${kb} ${logger.green(`${Date.now() - start}ms`)}`); // 记录日志

                ret.push(segment.image(buff)); // 将截图结果添加到数组中
            }

            page.close().catch((err) => logger.error(err)); // 关闭页面
        } catch (error) {
            logger.error(`图片生成失败:${name}:${error}`); // 如果出现错误，则记录错误日志
            /** 关闭浏览器 */
            if (puppeteer.browser) {
                await puppeteer.browser.close().catch((err) => logger.error(err)); // 关闭浏览器实例
            }
            puppeteer.browser = false;
            ret = [];
            return false;
        }
        this.shoting.pop(); // 从队列中移除当前截图任务

        if (ret.length === 0 || !ret[0]) {
            logger.error(`[图片生成][${name}] 图片生成为空`);
            return false;
        }

        puppeteer.restart(); // 重新启动处理流程

        const code = ret.length > 0 ? 'success' : 'limit'; // 根据截图结果确定状态

        return { img: ret, code }; // 返回截图结果和状态
    }
}

export { puppeteerRender };