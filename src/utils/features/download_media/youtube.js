const ytdl = require('ytdl-core');

class YouTubeDownloader {
  async download(url) {
    try {
        const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
  
      // Validate URL
      if (!ytdl.validateURL(url)) {
        return { success: false, error: 'Invalid YouTube URL' };
      }
      
      // Get video info
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      
      // Check if video is too long (optional limit)
      if (parseInt(duration) > 3600) { // 1 hour limit
        return { success: false, error: 'Video is too long (max 1 hour)' };
      }
      
      // For now, we'll return the original URL
      // In a real implementation, you'd download and serve the file
      return {
        success: true,
        title: title,
        duration: duration,
        downloadUrl: url, // Temporary - would be your server's download link
        originalUrl: url
      };
      
    } catch (error) {
      console.error('YouTube download error:', error);
      return { success: false, error: 'Failed to process video' };
    }
  }
}

module.exports = new YouTubeDownloader();
