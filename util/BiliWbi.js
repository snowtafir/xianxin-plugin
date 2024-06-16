import fetch from "node-fetch";
import md5 from 'md5';

//重排码
const mixinKeyEncTab = [
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
	33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
	61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
	36, 20, 34, 44, 52
]

// 获取最新的 img_key 和 sub_key
async function getWbiKeys(headers) {
	const url = 'https://api.bilibili.com/x/web-interface/nav';
	await new Promise((resolve) => setTimeout(resolve, 0));
	const resp = await fetch( url, {
		method: "GET",
		headers: {
			"User-Agent": headers["User-Agent"],
			"Referer": headers["Referer"]
		}
	} )
	const json_content = await resp.json();
	const img_url = json_content.data.wbi_img.img_url;
	const sub_url = json_content.data.wbi_img.sub_url;
	return {
		img_key: img_url.substring(img_url.lastIndexOf('/') + 1, img_url.length).split('.')[0],
		sub_key: sub_url.substring(sub_url.lastIndexOf('/') + 1, sub_url.length).split('.')[0]
	}
}

// 对 imgKey 和 subKey 进行字符顺序打乱编码
async function getMixinKey(orig) {
	let temp = ''
	mixinKeyEncTab.forEach((n) => {
		temp += orig[n]
	})
	return temp.slice(0, 32)
}

async function encWbi(params, img_key, sub_key) {
	const mixin_key = getMixinKey(img_key + sub_key),
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
	//let sub = query + '&w_rid=' + wbi_sign
	return {
		wts: curr_time,
		w_rid: wbi_sign,
		query: query
	}
}

/**  */
/**
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md#javascript
 * 对实际请求参数进行 wbi 签名, 生成 wbi 签名
 * @param {object} params 除了 wbi 签名外的全部请求参数，例如 api get请求的查询参数 { uid: 12345678, jsonp: jsonp}
 * @param {object} headers 必需要 referer 和 UA 两个请求头
 */
async function getWbiSign(params, headers) {
	const { img_key, sub_key } = await getWbiKeys(headers);
	return encWbi(params, img_key, sub_key);
}

/**
 * https://github.com/SocialSisterYi/bilibili-API-collect/issues/868#issuecomment-1919593911
 *
 * 生成 dm_img 相关参数
 */
async function getDmImg() {
	const dm_img_list = [];
	// 这俩值可以不用随机，直接用实际的真实值即可。
	const dm_img_str = "V2ViR0wgMS4wIChPcGVuR0wgRVMgMi4wIENocm9taXVtKQ";// "webgl version:" base64Decode=
	const dm_cover_img_str = "QU5HTEUgKEludGVsIEluYy4sIEludGVsKFIpIFVIRCBHcmFwaGljcyA2MzAsIE9wZW5HTCA0LjEp" + "R29vZ2xlIEluYy4gKEludGVs";// "webgl unmasked renderer" + Google Inc. (Intel ： base64Decode = ANGLE (Intel Inc., Intel(R) UHD Graphics 630, OpenGL 4.1)Google Inc. (Intel
	const dm_img_inter = { ds: [], wh: [0, 0, 0], of: [0, 0, 0] };
	return {
		dm_img_list,
		dm_img_str,
		dm_cover_img_str,
		dm_img_inter,
	};
};

export { getWbiSign, getDmImg }