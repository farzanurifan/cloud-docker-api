
// Farza Nurifan

// Import
var bodyParser = require('body-parser')
var express = require('express')
var fs = require('fs-extra')
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({ uploadDir: './data' })

var auth = require('./function/auth')
var file = require('./function/file')
var dir = require('./function/dir')

// Express config
var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// API //
// Auth
app.post('/api/register', auth.register)
app.post('/api/login', auth.login)

// File
app.post('/api/upload', multipartMiddleware, file.upload)
app.post('/api/download', file.download)
app.post('/api/delete', file.delete)
app.post('/api/rename', file.rename)
app.post('/api/list', file.list)
app.post('/api/movefile', file.movefile)

// Dir
app.post('/api/mkdir', dir.mkdir)
app.post('/api/rmdir', dir.rmdir)
app.post('/api/listdir', dir.listdir)
app.post('/api/movedir', dir.movedir)


// Start listening on localhost:3000
app.listen(3000, () => console.log('listening on 3000'))





// app.post('/api/premium', (req, res) => {
//     var id = ObjectId(req.cookies.cloud_id)
//     db.collection(table).find(id).toArray((err, results) => {
//         if (results) {
//             var premium = true
//             var update = { premium }

//             db.collection(table).updateOne({ _id: id }, { $set: update }, (err, result) => {
//                 
//                 res.redirect('/')
//             })
//         }
//     })
// })
// app.get('/api/size/:id', (req, res) => {
//     var id = req.params.id
//     getSize(`./data/${id}`, (err, folderSize) => {
//         
//         var size = folderSize
//         res.json({ size })
//     })
// })