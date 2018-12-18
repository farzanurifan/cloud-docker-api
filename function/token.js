var jwt = require('jsonwebtoken')

module.exports = {
    key: 'rahasia',
    verify: (token, key, res, successFunc, errFunc) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                errFunc()
                res.json({ message: 'Failed to authenticate token.' });
            } else {
                successFunc(decoded, res)
            }
        })
    }
}