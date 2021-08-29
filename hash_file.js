var fs = require('fs').promises;
var passwordHash = require('password-hash');
var path=require('path');
//var hashedPassword = passwordHash.generate('<//><dd>111115555599999<dd><//>');
var file_path=process.argv[2];
(async()=>{
	var content=await fs.readFile(path.join(file_path));
	var hash= passwordHash.generate(content)
	console.log(hash)
	//console.log(content)
})()
