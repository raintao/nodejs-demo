var express = require('express');
var router = express.Router();
var mysql=require("mysql");
var formidable=require("formidable");
var fs=require("fs");

// router.use(function (req, res, next) {
//   console.log("ddd");
//   console.log(req);
//   next();
// });
/* GET router page. */
router.get('/', function(req, res, next) {
    res.render('index',{users:'123'});
  //  res.redirect('index');
});
router.post('/login',function(req, res){
  var loginSql="SELECT * FROM mall_users WHERE user_name=? AND user_pwd=?";
  var conn=mysql.createConnection({
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
  conn.query(loginSql,[req.body.uname,req.body.upwd],function(err,result){
     if(err){console.log("query:"+err);return;}
     var response={status:10001,message:'用户名或密码不正确'};
     if(result[0]){
       response.status=1000;
       response.message="登陆成功";
     }else {
       response.status=1001;
       response.message="用户名或密码不正确";
     }
     res.contentType('json');//返回的数据类型
     res.end(JSON.stringify(response));
   });
   //关闭connection
   conn.end(function(err){
     if(err){return;}
     console.log("conn end succend!");
   });
});

var pool=mysql.createPool({
  host:'127.0.0.1',
  user:'root',
  password:'123456',
  database:'users',
  port:3306
 });
 //监听connection事件
pool.on('connection', function(connection) {
  connection.query('SET SESSION auto_increment_increment=1');
});
var output = {
    record_count:0,	/*总记录数*/
    page_size:20,		/*每页的记录数*/
    page_count:0,		/*总页数*/
    cur_page:1,	/*当前页号*/
    message:{}			/*当前页中的数据*/
  };
var start,count;
function doPage(page){
  output.record_count=parseInt(page);//总记录数
  output.page_count=Math.ceil(output.record_count/output.page_size);//总页数
  start=(output.cur_page-1)*output.page_size;//从哪页开始读取
  count=output.page_size;//一次读取几行
}
router.get('/user',function(req,res){
  res.contentType('json');//返回的数据类型
  output.cur_page=parseInt(req.query.pno);
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);return;}
    if(req.query.variable==0){ //如果是提问者（普通用户）
      var userSql="SELECT COUNT(uid) FROM t_users";
      conn.query(userSql,function(err,result){
        console.log(result);
        doPage(result[0]['COUNT(uid)']);
        var sql="SELECT * FROM t_users ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,[start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
        });
        conn.release();//调用connection.release()方法，会把连接放回连接池，等待其它使用者使用!
      });
    }else if(req.query.variable==1){  //回答者
      var sql="SELECT COUNT(uid) FROM t_users WHERE is_answer = ?";
      conn.query(sql,[req.query.variable],function(err,result){
        doPage(result[0]['COUNT(uid)']);
        var sql="SELECT * FROM t_users WHERE is_answer=? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,[req.query.variable,start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
        });
        conn.release();
      });
    }else if(req.query.variable==2){  //商家
      var sql="SELECT COUNT(uid) FROM t_users WHERE seller_name IS NOT NULL";
      conn.query(sql,function(err,result){
        doPage(result[0]['COUNT(uid)']);
        var sql="SELECT * FROM t_users WHERE seller_name IS NOT NULL ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,[start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
        });
        conn.release();
      });
    }
  });
});
router.get('/userSearch',function(req,res){
  res.contentType('json');//返回的数据类型
  output.cur_page=parseInt(req.query.pno);
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);return;}
    var key1=req.query.variable,key2=req.query.telphone,key3=req.query.company;
    var searchSql;
    if(key1!==""&&key2==""&&key3==""){
      searchSql="SELECT COUNT(uid) FROM t_users WHERE concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ?";
      conn.query(searchSql,['%'+key1+'%'],function(err,result){
        doPage(result[0]['COUNT(uid)']);
        // console.log(start+":"+count);
        var sql="SELECT * FROM t_users WHERE  concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,['%'+key1+'%',start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
        });
        conn.release();
      });
    }else if(key1!==""&&key2!==""&&key3==""){
      searchSql="SELECT COUNT(uid) FROM t_users WHERE concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? AND concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ?";
      conn.query(searchSql,['%'+key1+'%','%'+key2+'%'],function(err,result){
        doPage(result[0]['COUNT(uid)']);
        var sql="SELECT * FROM t_users WHERE  concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? AND concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,['%'+key1+'%','%'+key2+'%',start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
        });
        conn.release();
      });
    }else if(key1!==""&&key2!==""&&key3!==""){
      searchSql="SELECT COUNT(uid) FROM t_users WHERE  concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? AND concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? AND concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ?";
      conn.query(searchSql,['%'+key1+'%','%'+key2+'%','%'+key3+'%'],function(err,result){
        doPage(result[0]['COUNT(uid)']);
        var sql="SELECT * FROM t_users WHERE  concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? AND concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? AND concat(telphone,nick_name,uid,created_at,answer_count,answer_star,ask_count,ask_star,seller_name,service_tags,service_cat) LIKE ? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,['%'+key1+'%','%'+key2+'%','%'+key3+'%',start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
        });
        conn.release();
      });
    }
  });
});
router.get('/userDetail',function(req,res){
  res.contentType('json');//返回的数据类型
  var userOutput={};
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);return;}
    conn.query("SELECT * FROM t_users WHERE uid = ?",[req.query.key],function(err,result){
      userOutput.detail=result;
      // console.log(result);
      conn.release();
    });
  });
  // 创建question连接池
  var questionPool=mysql.createPool({
    host:'127.0.0.1',
   user:'root',
   password:'123456',
   database:'questions',
   port:3306
  });
  questionPool.on('connection',function(connection){
    connection.query('SET SESSION auto_increment_increment=1');
  });
  questionPool.getConnection(function(err,qusConn){
    if(err){console.log("POOL==>"+err);return;}
    qusConn.query("SELECT * FROM t_questions WHERE ask_uid = ?",[req.query.key],function(err,qusResult){
      userOutput.question=qusResult;
      res.end(JSON.stringify(userOutput));
      qusConn.release();
    });
  });
});
router.post('/userDelete',function(req,res){
  res.contentType('json');//返回的数据类型
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);return;}
    conn.query("DELETE FROM t_users WHERE uid = ?",[req.body.key],function(err,result){
      res.end(JSON.stringify(result));
      conn.release();
    });
  });
});
router.post("/userSave",function(req,res){
  res.contentType('json');//返回的数据类型
  pool.getConnection(function(err,conn){
    if(err){console.log("POOL==>"+err);return;}
    var sql="UPDATE t_users SET nick_name= ?,service_cat= ?,service_tags= ?  WHERE uid = ?";
    var saveArr=[req.body.nick_name,req.body.service_cat,req.body.service_tags,req.body.key];
    conn.query(sql,saveArr,function(err,result){
      if(result){result.status=1000;}
      res.end(JSON.stringify(result));
      conn.release();
    });
  });
});
router.post("/upload",function(req,res){
  res.contentType("json");
  var backResult={},url="";
  var form=new formidable.IncomingForm();//创建上传表单
  // console.log(form);
  form.encoding="utf-8";
  form.uploadDir="./public/img/"; //设置上传目录
  form.keepExtensions=true;//保留后缀
  form.maxFieldsSize=2*1024*1024; //文件大小限制
  form.parse(req,function(err,fields,files){
    if(err){console.log("form files:"+err);return;}
    var extName="";
    //  console.log(fields.key);
    //  console.log(fields.tell);
    switch (files.imgfile.type) {
      case "image/pjpeg":
        extName="jpg";
        break;
      case "image/jpeg":
        extName="jpg";
        break;
      case "image/png":
        extName="png";
        break;
      case "image/x-png":
        extName="png";
        break;
    }
    if(extName.length==0){
      backResult.message="只支持png和jpg格式图片";
      res.end(JSON.stringify(backResult));
      return;
    }
    var avatarName=Date.parse(new Date())+"."+extName; //设置文件名
    var newPath=form.uploadDir+avatarName; //路径
    // console.log(newPath);
    fs.renameSync(files.imgfile.path,newPath);//重命名
    backResult.message="文件上传成功！";
    url="img/"+avatarName;
    // console.log("****"+url);
    //修改数据库中数据
    pool.getConnection(function(err,conn){
      if(err){console.log("POOL==>"+err);return;}
      conn.query("UPDATE t_users SET head_img_url= ? WHERE uid= ? ",[url,fields.key],function(err,result){
        // console.log(result);
        if(result.affectedRows){backResult.status=1000;backResult.url=url;}else{backResult=1001;}
        res.end(JSON.stringify(backResult));
        conn.release();
      });
    });
  });
});
//订单数据
var orderPool=mysql.createPool({
  host:'127.0.0.1',
   user:'root',
   password:'123456',
   database:'orders',
   port:3306
});
orderPool.on("connection",function(connection){
  connection.query('SET SESSION auto_increment_increment=1');
});
router.get("/order",function(req,res){
  res.contentType("json");
  output.cur_page=parseInt(req.query.pno);
  orderPool.getConnection(function(err,conn){
    if(err){console.log("ORDERPOOL==>"+err);return;}
    var orderSql="SELECT COUNT(oid) FROM t_orders";
    conn.query(orderSql,function(err,result){
      doPage(result[0]['COUNT(oid)']);
      var sql="SELECT * FROM t_orders ORDER BY created_at DESC LIMIT ?,?";
      conn.query(sql,[start,count],function(err,result){
        if(result[0]){output.message=result;}
        // console.log(result);
        res.end(JSON.stringify(output));
        output.message="";
        conn.release();//调用connection.release()方法，会把连接放回连接池，等待其它使用者使用!
      });
    });
  });
});
router.get("/orderDetail",function(req,res){
  res.contentType('json');//返回的数据类型
  orderPool.getConnection(function(err,conn){
    if(err){console.log("ORDERPOOL==>"+err);return;}
    conn.query("SELECT * FROM t_orders WHERE oid = ?",[req.query.key],function(err,result){
      res.end(JSON.stringify(result));
      conn.release();
    });
  });
});
router.get("/orderSearch",function(req,res){
  res.contentType('json');//返回的数据类型
  output.cur_page=parseInt(req.query.pno);
  orderPool.getConnection(function(err,conn){
    if(err){console.log("orderPool==>"+err);return;}
    var key1=req.query.variable,key2=req.query.telphone,key3=req.query.company;
    var orderSql;
    if(key1!==""&&key2==""&&key3==""){
      orderSql="SELECT COUNT(oid) FROM t_orders WHERE concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ?";
      conn.query(orderSql,['%'+key1+'%'],function(err,result){
        doPage(result[0]['COUNT(oid)']);
        var sql="SELECT oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money FROM t_orders WHERE  concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,['%'+key1+'%',start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
          conn.release();
        });
      });
    }else if(key1!==""&&key2!==""&&key3==""){
      orderSql="SELECT COUNT(oid) FROM t_orders WHERE concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? AND concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ?";
      conn.query(orderSql,['%'+key1+'%','%'+key2+'%'],function(err,result){
        doPage(result[0]['COUNT(oid)']);
        var sql="SELECT oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money FROM t_orders WHERE  concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? AND concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,['%'+key1+'%','%'+key2+'%',start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
          conn.release();
        });
      });
    }else if(key1!==""&&key2!==""&&key3!==""){
      orderSql="SELECT COUNT(oid) FROM t_orders WHERE  concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? AND concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? AND concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ?";
      conn.query(orderSql,['%'+key1+'%','%'+key2+'%','%'+key3+'%'],function(err,result){
        doPage(result[0]['COUNT(oid)']);
        var sql="SELECT oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money FROM t_orders WHERE  concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? AND concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? AND concat(oid,seller_uid,seller_company,seller_title,seller_name,pay_status,goods_desc,created_at,pay_money) LIKE ? ORDER BY created_at DESC LIMIT ?,?";
        conn.query(sql,['%'+key1+'%','%'+key2+'%','%'+key3+'%',start,count],function(err,result){
          if(result[0]){output.message=result;}
          res.end(JSON.stringify(output));
          output.message="";
          conn.release();
        });
      });
    }
  });
});
module.exports = router;
