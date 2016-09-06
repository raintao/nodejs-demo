$(".aclick").click(function(){
  console.log('action');
  $.post("/aa",{uname:"zhangtao",pwd:"123"},function(data){
    console.log(data);
  });
});
