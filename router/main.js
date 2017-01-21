module.exports = function(app)
{

     app.get('/',function(req,res){
        res.render('index.html')
     });
     app.get('/chat',function(req,res){
        res.render('chat.html');
    });
}