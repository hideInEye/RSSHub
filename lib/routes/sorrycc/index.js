const config = require('@/config').value;
const got = require('@/utils/got');
const cheerio = require('cheerio');
const date = require('@/utils/parse-date');

const WORDPRESS_HASH = 'f05fca638390aed897fbe3c2fff03000';

module.exports = async (ctx) => {
    const url = 'https://sorrycc.com';
    const cookie = config.sorrycc.cookie;
    const limit = ctx.request.query.limit ? Number.parseInt(ctx.request.query.limit, 10) : 100;
    const res = await got(`${url}/wp-json/wp/v2/posts?per_page=${limit}`);

    const data = res.data;
    const items = await Promise.all(
        data.map(async (item) => {
            let singleItem = {};
            const title = item.title.rendered;
            const link = item.link;

            // const cached = await ctx.cache.get(link);
            const updated = date.parseDate(item.modified_gmt);
            // if (cached) {
            //     return JSON.parse(cached);
            // }
            if (item.categories.includes(7) && cookie) {
                const detailRes = await got(link, {
                    headers: {
                        Cookie: `wordpress_logged_in_${WORDPRESS_HASH}=${cookie}`,
                    },
                });
                const capture = cheerio.load(detailRes.data);
                const description = capture('.post').html();

                singleItem = {
                    title,
                    description,
                    link,
                    guid: link,
                    pubDate: updated,
                };
                return singleItem;
            }
            singleItem = {
                title,
                description: item.content.rendered,
                link,
                guid: link,
                pubDate: updated,
            };
            // await ctx.cache.set(link, JSON.stringify(singleItem));
            return singleItem;
        })
    );

    ctx.state.data = {
        title: '云谦的博客',
        link: url,
        item: items,
    };
};
