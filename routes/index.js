var express = require('express');
var router = express.Router();
var mysql=require('mysql');
// 连接池配置
var pool=mysql.createPool({
   host:'127.0.0.1',
   user:'root',
   password:'123456',
   database:'mirrorer',
   port:3306
 });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '谜语着科技' });
});
//登陆路由
router.all('/login',notAuthentication);
router.get('/login',function(req, res){
        res.render('login', { title: '用户登陆'});
      });
router.post('/dologin',function(req, res){
/*  var conn=mysql.createConnection({
     host:'127.0.0.1',
     user:'root',
     password:'123456',
     database:'mirrorer',
     port:3306
   });
   conn.connect(function(err){
     if(err){console.log("[query]-:"+err);return;}
     console.log('conn.connect succeed!');
   });
 //执行SQL语句
 conn.query('SELECT * FROM mall_users WHERE user_name=? AND user_pwd=?',[req.body.username,req.body.password],function(err,result){
 //conn.query('SELECT * FROM mall_users',function(err,result){
   if(err){console.log("query:"+err);return;}
   console.log('The result is:'+result);
   if(result){
     req.session.user=result[0];
     return res.redirect('/home');
   }else{
     req.session.error="用户名或密码不正确";
     return  res.redirect('/login');
   }
 });
 //关闭connection
 conn.end(function(err){
   if(err){return;}
   console.log("conn end succend!");
 });
 */
  var selectSql='SELECT * FROM mall_users WHERE user_name=? AND user_pwd=?';
  var selectData=[req.body.username,req.body.password];
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);}
    conn.query(selectSql,selectData,function(err,result){
      if(err){console.log("conn err:"+err);}
      for(var k in result){
        console.log(k+":"+result[k]);
        for(var i in result[k]){
          console.log(i+":"+result[k][i]);
        }
      }
      if(result){
        req.session.user=result[0];
        return res.redirect('/home');
      }else{
        req.session.error="用户名或密码不正确";
        return res.redirect('/login');
      }
      conn.release();
    });
  });

});
router.get('/logout',authentication);
router.get('/logout',function(req, res){
  req.session.user=null;
  res.redirect('/');
});
router.get('/home',authentication);
router.get('/home',function(req, res){
  res.render('home', { title: 'Home'});
});
function authentication(req, res, next) {
  if (!req.session.user) {
    req.session.error='请先登陆';
    return res.redirect('/login');
  }
  next();
}
function notAuthentication(req, res, next) {
  if (req.session.user) {
    req.session.error='已登陆';
    return res.redirect('/');
  }
  next();
}
module.exports = router;
