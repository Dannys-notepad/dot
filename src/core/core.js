const telegramInterface = require('../platform/telegram/telegram')

module.exports = async (platform) => {
    try {
        if(platform && typeof platform === 'string'){
            await platform()
        }
    } catch (error) {
        console.error(error)
    }
}

/*
    TODO
    1   >   make the core a function that runs/start other platform interface.
    2   >   make it reply to greetings, with ready made templates.
    3   >   make/add message template jso files.
*/