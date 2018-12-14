
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const fs = require('fs-extra')
const getSize = require('get-folder-size')
const passwordHash = require('password-hash')
const ObjectId = require('mongodb').ObjectID
const jwt = require('jsonwebtoken')
const request = require('request')
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({ uploadDir: './data' })
const fsPath = require('fs-path')

// MongoDB config
const uri = 'mongodb+srv://farzanurifan:bismillah@bdt-6ij3v.mongodb.net/test'
const database = 'cloud'
const table = 'myGallery'

// Log
const logError = (err) => { if (err) return console.log(err) }

// Token config
key = 'rahasia'

// Express config
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// Database connection
var db
MongoClient.connect(uri, { useNewUrlParser: true, }, (err, client) => {
    logError(err)
    db = client.db(database)
})

// Start listening on localhost:3000
app.listen(3000, () => console.log('listening on 3000'))


// API //

// app.post('/api/premium', (req, res) => {
//     var id = ObjectId(req.cookies.cloud_id)
//     db.collection(table).find(id).toArray((err, results) => {
//         if (results) {
//             var premium = true
//             var update = { premium }

//             db.collection(table).updateOne({ _id: id }, { $set: update }, (err, result) => {
//                 logError(err)
//                 res.redirect('/')
//             })
//         }
//     })
// })

app.post('/api/register', (req, res) => {
    var name = req.body.name
    var email = req.body.email
    var password = passwordHash.generate(req.body.password)
    var data = { name, email, password, premium: false }
    db.collection(table).save(data, (err, result) => {
        logError(err)
        if (!err) {
            dir = `./data/${result.ops[0]._id}`
            fs.mkdirSync(dir)
            res.json({ message: 'User created' })
        }
    })
})

app.post('/api/login', (req, res) => {
    var email = req.body.email
    var password = req.body.password

    db.collection(table).find({ email }).toArray((err, results) => {
        result = results[0]
        if (!result) return res.json({ message: 'User not found' })

        var loggedIn = passwordHash.verify(password, result.password)
        if (loggedIn) {
            var token = jwt.sign(result, key, { expiresIn: 5 * 60 }) // dalam detik
            res.json({ message: 'OK', token })
        }
        else res.json({ message: 'Wrong password ' })
    })
})

app.post('/api/upload', multipartMiddleware, (req, res) => {
    var maxCapacity = 10 * 1024 * 1024
    var file = req.files.file
    var tmp_path = file.path
    var token = req.body.token

    // var premium = ''
    // if (premium == 'true') {
    //     maxCapacity = maxCapacity * 1024
    // }

    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            fs.unlink(tmp_path);
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            request({
                method: 'GET',
                url: `http://127.0.0.1:3000/api/size/${id}`,
                json: true
            }, (error, response) => {
                logError(error)
                var size = response.body.size
                var maxSize = maxCapacity - size

                if (file.size > maxSize) {
                    fs.unlink(tmp_path, function () {
                        res.json({ message: 'File size exceeded the limit' })
                    });
                } else {
                    var target_path = `./data/${id}/${file.name}`
                    fs.rename(tmp_path, target_path, function (err) {
                        if (err) throw err
                        fs.unlink(tmp_path, function () {
                            res.json({ message: 'File uploaded' })
                        });
                    });
                }
            })
        }
    })
})

app.post('/api/download', (req, res) => {
    var token = req.body.token
    var filename = req.body.filename
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            res.download(`./data/${id}/${filename}`)
        }
    })
})

app.post('/api/delete', (req, res) => {
    var token = req.body.token
    var filename = req.body.filename
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            fs.unlink(`./data/${id}/${filename}`, (err) => {
                logError(err)
                res.json({ message: 'Berhasil hapus' })
            })
        }
    })
})

app.post('/api/rename', (req, res) => {
    var token = req.body.token
    var oldName = req.body.oldName
    var newName = req.body.newName
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            fs.rename(`./data/${id}/${oldName}`, `./data/${id}/${newName}`, (err) => {
                logError(err)
                res.json({ message: 'Berhasil rename' })
            })
        }
    })
})

app.post('/api/list', (req, res) => {
    var token = req.body.token
    var dir = req.body.dir
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            fs.readdir(`./data/${id}/${dir}`, (err, items) => {
                res.json({ items })
            })
        }
    })
})

app.post('/api/mkdir', (req, res) => {
    var token = req.body.token
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            var dir = `./data/${id}/${req.body.dir}`
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir)
                res.json({ message: 'ok' })
            }
            else {
                res.json({ message: 'udah ada' })
            }
        }
    })
})

app.post('/api/rmdir', (req, res) => {
    var token = req.body.token
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            var dir = `./data/${id}/${req.body.dir}`
            if (!fs.existsSync(dir)) {
                res.json({ message: 'ga ada' })
            }
            else {
                fs.removeSync(dir)
                res.json({ message: 'ok' })
            }
        }
    })
})

app.post('/api/listdir', (req, res) => {
    var token = req.body.token
    var dir = req.body.dir
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            fsPath.find(`./data/${id}/${dir}`, (err, list) => {
                var dirs = list.dirs
                let len = dirs.length
                let directory = []
                while (len--) {
                    directory[len] = dirs[len].split('\\').slice(2)
                }
                res.json({ directory })
            })
        }
    })
})

app.post('/api/movefile', (req, res) => {
    var token = req.body.token
    var oldPath = req.body.oldPath
    var newPath = req.body.newPath
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            fs.rename(`./data/${id}/${oldPath}`, `./data/${id}/${newPath}`, (err) => {
                logError(err)
                res.json({ message: 'Berhasil move' })
            })
        }
    })
})

app.post('/api/movedir', (req, res) => {
    var token = req.body.token
    var oldPath = req.body.oldPath
    var newPath = req.body.newPath
    jwt.verify(token, key, function (err, decoded) {
        if (err) {
            res.json({ message: 'Failed to authenticate token.' });
        } else {
            var id = decoded._id
            fs.move(`./data/${id}/${oldPath}`, `./data/${id}/${newPath}`, (err) => {
                logError(err)
                res.json({ message: 'Berhasil move' })
            })
        }
    })
})

app.get('/api/size/:id', (req, res) => {
    var id = req.params.id
    getSize(`./data/${id}`, (err, folderSize) => {
        logError(err)
        var size = folderSize
        res.json({ size })
    })
})