//first connection
socket.on('chat', function (data) {      

    var col = 'chat';                
    var h = 48; 
    var d = (new Date()).getTime() - (h * 60 * 60 * 1000);

    var s = {'date':-1};

    var l = 20;
    var t = {'date':{'$gte':d}, 'hide':0 };
    var p = {};

    db.collection(col).find(t, p).limit(l).sort(s).toArray(function(err, docs) {
        if (err) console.log(err);
        
        var x = [];            
        docs.forEach(function(doc, i, o) {                            
            
            if (doc) 
                x.push(doc);
             
        });
        
        socket.emit('chat', x);
        
    });

});    


//receive new messages, insert and then emit to all clients
//**no security checks
socket.on('m', function (d) {
    var col =           'chat';                
    var id =            (''+ d.username +''+ d.content +''+ d.date).hashCode();        
    var i = {    
        '_id':          ''+id,
        'username':     d.username,
        'content':      d.content,
        'date':         d.date,
        'hide':         0            
    };
    
    db.collection(col).insert(i);    
    
    io.emit('m', i);
    
});


//create random username
socket.on('rand', function(d){
    
    var http = require('http');
    var data = '';
    
    //setup options
    var get_options = {
        port: '80',
        host: 'randomword.setgetgo.com',
        path: '/get.php',
        method: 'GET'
    };

    //setup request
    var get_req = http.get(get_options, function(res) {

        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));

        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            socket.emit('rand', {'f':data});
        });
    });           
    
    
});

