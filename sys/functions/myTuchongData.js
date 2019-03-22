
var DB = require('../core/DB.js'),
	collectionName = 'cache',
	mongon_ID = 'tuchong_bh-lay',
	request = require('request'),
	clientUserAgent = 'bh-lay api robots'


// 从数据库读取
function getFromDataBase(callback){
	DB.getCollection(collectionName)
		.then(({collection, closeDBConnect}) => {
			collection.find({
				id : mongon_ID
			}).toArray(function(err, docs) {
				closeDBConnect()
				if(arguments[1].length==0){
				// 若不存在，则从 720yun 上获取
					updateFromTuchong(function(err,data){
						callback && callback(err,data)
					})
				}else{
					callback&&callback(null,docs[0])
				}
			})
		}).catch(err => {
			callback && callback(err)
		})
}
// 保存到数据库
function saveDataToDataBase(data){
	data.id = mongon_ID
	DB.getCollection(collectionName)
		.then(({collection, closeDBConnect}) => {
			// 查询用户信息
			collection.find({
				id : mongon_ID
			})
				// 计算条数
				.countDocuments(function(err,count){
					if(count > 0){
						// 条数存在，则直接更新
						collection.updateOne({
							id: mongon_ID
						}, {
							$set: data
						}, function() {
							closeDBConnect()
						})
					}else{
						// 不存在则插入为新数据
						collection.insertOne(data,function(){
							closeDBConnect()
						})
					}
				})
		})

}

// 从720yun更新数据
function updateFromTuchong(callback){
	request({
		url: 'https://bh-lay.tuchong.com/rest/2/sites/1785007/posts?count=40&page=1&before_timestamp=0',
		headers: {
			'User-Agent': clientUserAgent,
			'Referer': 'https://bh-lay.tuchong.com/'
		}
	}, function (err, response, body){
		response = response || {}
		if(err || response.statusCode != 200){
			callback && callback('error')
			return
		}
		var userData = JSON.parse( body || {} )
		callback && callback(null,userData)
		// 保存到数据库
		saveDataToDataBase(userData)
	})
}

exports.update = updateFromTuchong
exports.get = getFromDataBase