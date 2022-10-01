/* eslint-disable no-console */
const isProduction = process.env.NODE_ENV === 'production'

exports.log = (message, ...args) => {
    if (!isProduction) {
        if(args =! []){
            console.log(message, args)
        } else {
            console.log(message)
        }
    }
}

exports.error = (err) => {
    if (!isProduction) console.error(err)
}