module.exports = (str) => {
    if (str.endsWith(".png")) return "image/png";
    if (str.endsWith(".jpg")) return "image/jpg"
    if (str.endsWith(".jpeg")) return "image/jpeg"
    if (str.endsWith(".mp4")) return "video/mp4";
    if (str.endsWith(".mp3")) return "audio/mpeg";
    throw new "Unknown mimetype " + str;
}