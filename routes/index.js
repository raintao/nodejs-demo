var express = require('express');
var router = express.Router();
var mysql=require('mysql');
// 创建连接池配置
var pool=mysql.createPool({
   host:'127.0.0.1',
   user:'root',
   password:'123456',
   database:'mirrorer',
   port:3306
 });
 //监听connection事件
pool.on('connection', function(connection) {
  connection.query('SET SESSION auto_increment_increment=1');
});
/* GET router page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '谜语着科技' });
});
//登陆路由
router.all('/login',notAuthentication);
router.get('/login',function(req, res){
        res.render('login', { title: '用户登陆'});
      });
router.post('/dologin',function(req, res){
  var selectSql='SELECT * FROM mall_users WHERE user_name=? AND user_pwd=?';
  var selectData=[req.body.username,req.body.password];
  var addSql='INSERT INTO mall_users VALUES(NULL,?,?)';
  var addData=['admin','admin'];
  var updateSql='UPDATE mall_users SET user_name=?,user_pwd=? WHERE user_id=?';
  var deleteSql="DELETE FROM mall_users WHERE user_id=?";
  // pool.getConnection这是共享连接池的方法，一次可以连接多个，默认是个conn，
  // 当然也可以直接使用pool.query('',function(){})直接使用
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);}
    conn.query(selectSql,selectData,function(err,result){
      if(err){console.log("select err:"+err);}
      for(var k in result){//遍历查询结果
        console.log(k+":"+result[k]);
        for(var i in result[k]){
          console.log(i+":"+result[k][i]);
        }
      }
      if(result){//没有查询结果为false
        req.session.user=result[0];
        return res.redirect('/home');
      }else{
        req.session.error="用户名或密码不正确";
        return res.redirect('/login');
      }
      conn.release();//调用connection.release()方法，会把连接放回连接池，等待其它使用者使用!
    });
    // 共享连接池，mysql删除操作
    conn.query(deleteSql,["3"],function(err,result){
      if(err){console.log("delete err:"+err);}
      console.log("delete result:"+result);
      console.log("*********");
      for(var k in result){//遍历查询结果
        console.log(k+":"+result[k]);
        // for(var i in result[k]){
        //   console.log(i+":"+result[k][i]);
        // }
      }
      console.log("*********");
    });
    // 共享连接池，mysql的增加操作
  /*  conn.query(addSql,addData,function(err,result){
      if(err){console.log("add err:"+err);}
      console.log("add result:"+result);
      console.log("*********");
      for(var k in result){//遍历查询结果
        console.log(k+":"+result[k]);
        // for(var i in result[k]){
        //   console.log(i+":"+result[k][i]);
        // }
      }
      console.log("*********");
      //conn.release();//再次调用会报错，可能只需要放一个到连接池的底部，
    });
  */
    conn.query(updateSql,['zt','123','2'],function(err,result){
      if(err){console.log("update err:"+err);}
      console.log("update result:"+result);
      console.log("*********");
      for(var k in result){//遍历查询结果
        console.log(k+":"+result[k]);
        // for(var i in result[k]){
        //   console.log(i+":"+result[k][i]);
        // }
      }
      console.log("*********");
    //  conn.release();//调用connection.release()方法，会把连接放回连接池，等待其它使用者使用!
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
