import { getPuppeteer } from "./getPuppeteer.js";
import lodash from 'lodash';
import common from "../../../lib/common/common.js";
const _path = process.cwd();

/**
 * 处理截图生成
 * @param {string} name 模块名称
 * @param {object} param 传入资源数据
 * @param {boolean} isSplit 是否为分片截图：true / false
 * @returns {img: string[], code: string}
 */
async function screenshot(name, param, isSplit) {
    const pageHeight = 8000;

    const puppeteer = await getPuppeteer(); // 获取 Puppeteer 实例

    await puppeteer.browserInit(); // 初始化 Puppeteer 浏览器

    if (!puppeteer.browser) return false; // 如果浏览器实例不存在，则返回 false

    const savePath = puppeteer.dealTpl(name, param); // 根据参数生成保存路径

    if (!savePath) return false; // 如果保存路径不存在，则返回 false

    const page = await puppeteer.browser.newPage(); // 创建新页面

    try {
        await page.goto(`file://${_path}${lodash.trim(savePath, ".")}`, {
            timeout: 120000,
        }); // 跳转到指定页面

        const body = (await page.$("#container")) || (await page.$("body")); // 获取页面内容区域的 DOM 元素
        const boundingBox = await body.boundingBox(); // 获取内容区域的边界框信息

        const num = isSplit
            ? Math.ceil(boundingBox.height / pageHeight) || 1 // 根据是否需要分片，计算分片数量
            : 1; // 默认为 1

        const img = []; // 保存截图结果的数组
        let code = "success"; // 默认状态为 "success"

        for (let i = 1; i <= num; i++) {
            if (i > 1) {
                await page.evaluate(() => {
                    window.scrollBy(0, 8000); // 滚动页面到下一个分片位置
                });
                await common.sleep(300); // 等待一段时间，确保页面加载完成
            }

            const screenshotOptions = {
                type: "jpeg", // 图片类型为 JPEG
                quality: 90, // 图片质量为 90
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

            const buff = await page.screenshot(screenshotOptions); // 对指定区域进行截图

            puppeteer.renderNum++; // 增加截图次数
            /** 计算图片大小 */
            const kb = (buff.length / 1024).toFixed(2) + "kb"; // 计算图片大小
            if ((buff.length / 1024).toFixed(2) > 3500) {
                code = "limit"; // 如果图片大小超过 3500kb，则状态设为 "limit"
            }

            logger.mark(`[图片生成][${name}][${puppeteer.renderNum}次] ${kb}`); // 记录日志

            img.push(segment.image(buff)); // 将截图结果添加到数组中
        }

        page.close().catch((err) => logger.error(err)); // 关闭页面

        if (num > 1) {
            logger.mark(`[图片生成][${name}] 处理完成`); // 如果存在分片，则记录处理完成的日志
        }

        return { img, code }; // 返回截图结果和状态
    } catch (error) {
        logger.error(`图片生成失败:${name}:${error}`); // 如果出现错误，则记录错误日志
        /** 关闭浏览器 */
        if (puppeteer.browser) {
            await puppeteer.browser.close().catch((err) => logger.error(err)); // 关闭浏览器实例
        }
        puppeteer.browser = false;
        return { img: [], code: "limit" }; // 返回空的截图结果和 "limit" 状态
    }
}

export { screenshot };