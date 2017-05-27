const express = require('express')
const bodyParser = require('body-parser')
const babyparse = require('babyparse')
const fs = require('fs')
const csv = require('csv-express')
var app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control")
	next()
})

const multer = require('multer')

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'csv/') // Absolute path. Folder must exist, will not be created for you.
	},
	filename: function (req, file, cb) {
		cb(null, 'data.csv', file.originalname.length)
	}
})

const upload = multer({storage: storage})


app.post('/upload', upload.single('csv_data'), (req, res) => {
	let file = fs.readFileSync('csv/data.csv', { encoding: 'binary' }) 
	let final_date = new Date(req.body.final_date)
	let parsed = babyparse.parse(file, {
		header: true
	})
	let data = parsed.data
	let compiledData = {
		sent : {},
		receive :{} 
	}
	for(let i = 0; i < data.length; i++){
		let currentType
		let tmpData = {
			cur_date: new Date(data[i].TGL),
			delivery_num: data[i].SJ
		}
		if(data[i].KIRIM){
			currentType = 'sent'
			tmpData.qty = parseInt(data[i].KIRIM)
		}else{
			currentType = 'receive'
			tmpData.qty = 0
			if(data[i].MASUK){
				tmpData.qty += parseInt(data[i].MASUK)
			}
			if(data[i].RUSAK){
				tmpData.qty += parseInt(data[i].RUSAK)
			}
		}
		let name = data[i].NAMA.split(' ').join('_')
		if(name.substring(name.length-5) !== "Total"){
			if(!compiledData[currentType][name]){
				compiledData[currentType][name] = []
			}
			compiledData[currentType][name].push(tmpData)
		}
	}
	let costs = {}
	for (key in compiledData.sent){
		if(compiledData.receive[key]){
			if(!costs[key]){
				costs[key] = []
			}
			let sent = compiledData.sent[key]
			let receive = compiledData.receive[key]
			for(let i = 0; i < sent.length; i++){
				let j = 0
				while(sent[i].qty && j < receive.length){
					//https://stackoverflow.com/questions/3224834/get-difference-between-2-dates-in-javascript
					let duration = Math.ceil(Math.abs(sent[i].cur_date.getTime() - receive[j].cur_date.getTime()) / (1000 * 3600 * 24))
					let tmp_cost = {
						sent_date: sent[i].cur_date,
						recv_date: receive[j].cur_date,
						sent_dlv_num: sent[i].delivery_num,
						recv_dlv_num: receive[j].delivery_num,
						duration: duration
					}
					if(sent[i].qty < receive[j].qty){
						tmp_cost.qty = sent[i].qty
						receive[j].qty -= sent[i].qty
						sent[i].qty = 0
					}else{
						tmp_cost.qty = receive[j].qty
						sent[i].qty -= receive[j].qty
						receive[j].qty = 0
					}			
					j++
					if(tmp_cost.qty){
						costs[key].push(tmp_cost)
					}
				}	
			}
		}
	}
	for (key in compiledData.sent){
		if(!costs[key]){
			costs[key] = []
		}
		let sent = compiledData.sent[key]
		for(let i = 0; i < sent.length; i++){
			if(sent[i].qty){
				let duration = Math.ceil(Math.abs(sent[i].cur_date.getTime() - final_date.getTime()) / (1000 * 3600 * 24))
				let tmp_cost = {
					sent_date: sent[i].cur_date,
					recv_date: final_date, 
					sent_dlv_num: sent[i].delivery_num,
					recv_dlv_num: '-',
					duration: duration,
					qty: sent[i].qty
				}
				costs[key].push(tmp_cost)
			}
		}
	}
	let jsonToParse = []
	for (key in costs) {
		let names = key.split('_').join(' ')
		for (let i = 0; i < costs[key].length; i++){
			let tmp = {
				name: names,
				surat_jalan_kirim: costs[key][i].sent_dlv_num,
				surat_jalan_masuk: costs[key][i].recv_dlv_num,
				tanggal_kirim: costs[key][i].sent_date,
				tanggal_masuk: costs[key][i].recv_date,
				durasi: costs[key][i].duration,
				jumlah: costs[key][i].qty
			}
			//let tmp = costs[key][i]
			//tmp.names = names
			jsonToParse.push(tmp)
		}
	}
	//console.log(babyparse.unparse(jsonToParse))
	let jsonFile = babyparse.unparse(jsonToParse)
	//res.setHeader('Content-disposition', 'attachment', 'filename=penghitungan.csv')
	res.set({
		'Content-Type': 'text/csv',
		'Content-disposition': 'attachment; filename=penghitungan.csv',
	})
	res.status(200).send(jsonFile)
	//res.csv(jsonToParse,true) 
	//res.send(jsonToParse)
})

app.listen(3000, (err) => {
	if(err){
		console.log('error : ', err)
	}
	console.log('cool apps on port 3000')
})
