/*
 * @author bh-lay
 */

var DB = require('../../core/DB.js')

function get_list(data,callback){
	let limit_num = parseInt(data['limit'])||10
	let skip_num = parseInt(data['skip'])||0
	
	var resJSON = {
		code: 200,
		limit: limit_num,
		skip: skip_num,
	}
	
	DB.getCollection('labs')
		.then(({collection, closeDBConnect}) => {
			collection.countDocuments(function(err,count){
				resJSON['count'] = count
			
				collection.find({},{limit:limit_num}).sort({id:-1}).skip(skip_num).toArray(function(err, docs) {
					closeDBConnect()
					if(err){
						resJSON.code = 2
					}else{
						for(var i=0 in docs){
							delete docs[i]['content']
						}
						resJSON['list'] = docs
					}
					callback&&callback(resJSON)
				})
			})
		}).catch(() => {
			resJSON.code = 500
			callback&&callback(resJSON)
		})
}
function get_detail(data,callback){
	var labID = data['id']
	
	var resJSON={
		code: 200,
		id : labID
	}
	DB.getCollection('labs')
		.then(({collection, closeDBConnect}) => {
			collection.find({id:labID}).toArray(function(err, docs) {
				closeDBConnect()
				if(arguments[1].length==0){
					resJSON['code'] = 2
					resJSON['msg'] = 'could not find this lab ' + labID + ' !' 
				}else{ 
					resJSON['detail'] = docs[0]
				}
				callback&&callback(resJSON)
			})
		}).catch(err => {
			callback && callback(err)
		})
}

function this_control(connect,callback){
	var data = connect.url.search
	
	if(data['act']=='get_list'){
		get_list(data,function(json_data){
			callback&&callback(json_data)
		})
		
	}else if(data['act']=='get_detail'){
		if(data['id']){
			get_detail(data,function(json_data){
				callback&&callback(json_data)
			})
		}else{
			callback&&callback({
				'code' : 2,
				'msg' : 'plese tell me which lab you want to get !'
			})
		}
	}else{
		callback&&callback({
			'code' : 2,
			'msg' : 'plese use [act] get_detail or get_list !'
		})
	}
}

exports.render = function (route, connect, app){
	var url = connect.request.url

	app.cache.use(url,['ajax','labs'],function(this_cache){
		connect.write('json',this_cache)
	},function(save_cache){
		this_control(connect,function(this_data){
			save_cache(JSON.stringify(this_data))
		})
	})
}