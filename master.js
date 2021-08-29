const readline = require('readline');
const WebSocket = require('ws');
const chalk = require('chalk');
var fs = require('fs').promises;
var path = require('path');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
console.yellow=(log)=>{console.log(chalk.yellow(log))}

function master(){
	this.rl=readline.createInterface({
			  input: process.stdin,
			  output: process.stdout
			});

	this.rl.stdoutMuted=false;
	this.events=new MyEmitter()

	this.handel_rl_output=((rl)=>{
		rl._writeToOutput = function _writeToOutput(stringToWrite) {
		  if (rl.stdoutMuted)
		    rl.output.write("*");
		  else
		    rl.output.write(stringToWrite);
		};
	})(this.rl)

	this.socket;
	this.handel_connect=async()=>{
		return new Promise((res,rej)=>{
			this.rl.question('connect Domain ? ', (answer) => {
			  console.yellow('connecting ...')
			  try{
					var  serverAddress = `ws://${answer}/master`;
					this.socket  = new WebSocket(serverAddress, {
					    headers: {
					        "user-agent": "Mozilla"
					    },
					    rejectUnauthorized: false
					});
					this.socket.on('open', function() {
					    res(true)
					});				  		  			 
			   }catch(err){
			   	console.log(`err in connected to ${answer}`)
			   	console.log(err)
			   	res(false)
			   }
			});
		})
	}


	this.password=async()=>{
		return new Promise(async(res,rej)=>{
			this.rl.output.write("password: ");
			this.rl.stdoutMuted=true;
			this.rl.on('line', (input) => {
				fuction_name='auth';
				parameters=[input];
				message=JSON.stringify([fuction_name,parameters])
				this.socket.onmessage=(e)=>{
					if(e.data=='sucssess_auth'){
						res(true)
						this.rl.stdoutMuted=false;
					}else{
						var message=JSON.parse(e.data)
						var function_name=message[0];
						var parameters=message[1];
						try{
							this[function_name](...parameters)
						}catch(err){console.log('no function with this name')}
					}
				}
				this.socket.send(message)
			});			
		})
	}


	this.ask_for=(ask)=>{
		return new Promise((res,rej)=>{
			this.rl.question(ask, (answer) => {
				res(answer)
			});
		})
	}

	this.show_commands=()=>{
		console.log('commandes:','set_new_update','get_err_sheet')
	}

	this.file_set_on_temp_ack=(file_name)=>{
		return new Promise((res,rej)=>{
			this.events.on(`file_set_on_temp_ack_${file_name}`,(state)=>{
				res(state)
			})
		})
	}

	this.fire_file_set_on_temp_ack=(file_name,state)=>{
		this.events.emit(`file_set_on_temp_ack_${file_name}`,state)
	}

	this.set_new_update=async()=>{
		var folder_path=await this.ask_for('Folder Path : ')
		var files= await fs.readdir(path.join(folder_path));
		console.log(files)
		var sure=await this.ask_for('sure ? (y,n) : ')
		if(sure=='y'){
			try{
				for(var file of files){
					var content=await fs.readFile(path.join(folder_path,file));
					//console.log(content)
					var function_name='set_file_on_temp';
					var parameters=[file,content]
					var message=JSON.stringify([function_name,parameters])
					this.socket.send(message)
					var set_on_temp_state=await this.file_set_on_temp_ack(file)
					if(!set_on_temp_state){break}else{console.log(file,chalk.green(' Done '))}
				}
				create_update_from_tmp_answer= await this.ask_for(chalk.yellow('Create_update_from_tmp ? (y,n) : '))
				if(create_update_from_tmp_answer=='y'){this.create_update_from_tmp()}
			}catch(err){
				console.log(err)
			}
		}
		//this.socket.send(message)
	}

	this.create_update_from_tmp=async()=>{
		var function_name='create_update_from_tmp';
		var parameters=[];
		var message=JSON.stringify([function_name,parameters])	
		this.socket.send(message)
		var create_update_from_tmp_state=await this.create_update_from_tmp_ack()
		if(create_update_from_tmp_state){console.log(chalk.green(' Done '))}else{console.log(chalk.red(' Error '))}
	}

	this.update_connected_nodes=()=>{
		var function_name='update_connected_nodes';
		var parameters=[];
		var message=JSON.stringify([function_name,parameters])	
		this.socket.send(message)		
	}

	this.create_update_from_tmp_ack=()=>{
		return new Promise((res,rej)=>{
			this.events.on(`create_update_from_tmp_ack`,(state)=>{
				res(state)
			})
		})
	}

	this.fire_create_update_from_tmp_ack=(state)=>{
		this.events.emit(`create_update_from_tmp_ack`,state)
	}	

	this.handel_commands=async(answer)=>{
		switch(answer){
			case 'h':
				this.show_commands();
				break;
			case 'set_new_update':
				await this.set_new_update()
				break
			case 'create_update_from_tmp':
				await this.create_update_from_tmp()
				break
			case 'update_connected_nodes':
				await this.update_connected_nodes()
				break								
		}
	}

	this.set_ask_recerjen=()=>{
		this.rl.question(chalk.yellow(' -> '), async(answer) => {
			await this.handel_commands(answer)
			this.set_ask_recerjen()
		});
	}

	this.main_ruteen=(async()=>{
		var connect_state=await this.handel_connect()
		if(connect_state){
			auth_state=await this.password();
			if(auth_state){this.set_ask_recerjen()}else{process.exit();}
		}
		//this.set_ask_recerjen()
	})()
}

new master

//var client = new W3CWebSocket('ws://localhost:3000/master', 'echo-protocol');

/*
const WebSocket = require('ws');

// const serverAddress = "ws://127.0.0.1:5000";
const serverAddress = 'wss://nodes-manager.glitch.me/master';

const ws = new WebSocket(serverAddress, {
    headers: {
        "user-agent": "Mozilla"
    }
});

ws.on('open', function() {
    ws.send("Hello from PCamp!");
});

ws.on('message', function(msg) {
    console.log("Received msg from the server: " + msg);
});
*/

