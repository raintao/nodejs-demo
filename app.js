var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//添加session存储数据
var session=require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');


var ejs=require('ejs');
// var http=require('http');在bin／www中定义了
// 创建项目实例
var app = express();

// view engine setup
// 定义EJS模板引擎和模板文件位置，也可以使用jade或其他模型引擎
app.set('views', path.join(__dirname, 'views'));
app.engine('.html',ejs.__express);
app.set('view engine', 'html');// app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// 定义icon图标 app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// 定义日志和输出级别
app.use(logger('dev'));
// 定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 定义cookie解析器
app.use(cookieParser());
// app.use(cookieSession({secret : 'fens.me'}));
// app.use(app.router);这是express3版本的路由

app.use(session({
  resave:false,//添加这行
  saveUninitialized: true,//添加这行
  secret: 'recommand 128 bytes random string', // 建议使用 128 个字符的随机字符串
  cookie:{maxAge:10000}//expire session in 10 seconds
}));
//用于把登录用户设置到res.locals里面，在home.html里显示
app.use(function(req,res,next){
  res.locals.user = req.session.user;
  var err = req.session.error;
  delete req.session.error;
  res.locals.message = '';
  if (err) {
    res.locals.message = '<div class="alert bg-danger">' + err + '</div>';
  }
  // console.log('Session is = ',req.session.user);
  next();
});
// 定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
// 匹配路径和路由
app.use('/', routes);
app.use('/users', users);


// catch 404 and forward to error handler
// 404错误处理
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
// 开发环境，500错误处理和错误堆栈跟踪
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
