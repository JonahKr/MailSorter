let simpleParser = require("mailparser").simpleParser;
let Imap = require('imap');
let fs = require('fs');

const {
  user,
  password,
  host,
  port,
  tls,
  prefix
} = require("./config.json");

let attachments = [];

let imap = new Imap({
			user: user,
			password: password,
			host: host,
			port: port,
			tls: tls
});

function approveSubject(subject) {
  let ret = false;
  prefix.forEach( s=>{
    if(subject.startsWith(s)) ret = true;
  });
  return ret;
}

function initCheck() {//Initial Check if there are new messages and process them
  imap.search([ 'UNSEEN' ], (err, results) => {
    if (err) throw err;
    console.log(results.length, 'unseen emails');
  });
}

imap.once('ready', function (err) {

  if (err) console.log(err);
  imap.openBox('INBOX', false, function (err, box) {
    initCheck();
    if (err) console.log(err);
		imap.seq.search([], (err, uids) => {

		  if (err) console.log(err);
		  let f = imap.seq.fetch(uids, { bodies: [''] });
			f.on('message', function (msg, seqno) {
        msg.on('body', function (stream, info) {
				  simpleParser(stream, function (err, body) {
            if(approveSubject(body.subject)) {
  				    if (err) console.log(err);
  			      if (body.attachments.length > 0) {
  				      let files = body.attachments;
                for(att in files){
  				        if (err) console.error(err);
  				        let ex = fs.existsSync('./Attachments/' + files[att].filename);
  				        if(ex){
  				          console.log(files[att].filename + ' exists!');
  				          attachments.push({link:'/Attachments/' + files[att].filename, name: files[att].filename});
  				        }else{
  				          fs.writeFileSync('./Attachments/' + files[att].filename, files[att].content);
  				          if (err) console.log(err);
  				          console.log(files[att].filename + ' saved!');
  				          attachments.push({link:'/Attachments/' + files[att].filename, name: files[att].filename});
  				         }
  				       }
  				       imap.end();
  				    }
            }
				  });
				});
			});
		});
	});
});

imap.once('error', function (err) {
	console.log(err);
});

imap.once('end', (err) => {
	if (err) console.log(err);
});

imap.connect();
