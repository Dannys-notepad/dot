const axios = require('axios');
const cheerio = require('cheerio');

exports.getVideoInfo = async (url) => {
    try {
        if(!url){
            return 'url is needed'
        }

        const tiktokRegex = /https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/;
        const match = url.match(tiktokRegex)

        if(!match){
            return 'invalid url'
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        const $ = cheerio.load(response.data)

        const scriptContent = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION').html()

        if(!scriptContent){
            return 'could not extract video data'
        }

        const data = JSON.parse(scriptContent)

        const videoData = data.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct

        const result = {
            id: videoData.id,
            description: videoData.desc,
            createTime: videoData.createTime,
            author: {
                id: videoData.author.id,
                uniqueId: videoData.author.uniqueId,
                nickname: videoData.author.nickname
            },
            video: {
                id: videoData.video.id,
                duration: videoData.video.duration,
                ratio: videoData.video.ratio,
                downloadAddr: videoData.video.downloadAddr,
                playAddr: videoData.video.playAddr
            },
            stats: {
                diggCount: videoData.stats.diggCount,
                shareCount: videoData.stats.shareCount,
                commentCount: videoData.stats.commentCount,
                playCount: videoData.stats.playCount
            }
        }

        return result
    } catch (e) {
        console.error('faild to fetch video information: ', e)
    }
}

exports.downloadVideo = async (url) => {
    try {
        if(!url){
            return 'url is needed'
        }

        const tiktokRegex = /https?:\/\/(www\.)?tiktok\.com\/@.+\/video\/\d+/;
        const match = url.match(tiktokRegex)

        if(!match){
            return 'invalid url'
        }

        const infoResponse = await axios.get(`http://localhost:${PORT || 3000}/api/info?url=${encodeURIComponent(url)}`)

        const videoInfo = infoResponse.data

        if(!videoInfo.video.downloadAddr){
            console.log('could not find download address')
        }

        

        // Stream the video directly to the response
        const videoResponse = await axios({
            method: 'GET',
            url: videoInfo.video.downloadAddr,
            responseType: 'stream',
            headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': '*/*'
            }
        });
        
        //videoResponse.data.pipe(res);
    } catch (e) {
        console.error('faildt to download video: ', e)
    }
}

/*
    TOD
    Add proxy to aviod IP blocking
    Rate limiting
    Error handling
    Caching
*/