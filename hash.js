var passwordHash = require('password-hash');
var hashedPassword = passwordHash.generate('<//><dd>111115555599999<dd><//>');
console.log(hashedPassword);
