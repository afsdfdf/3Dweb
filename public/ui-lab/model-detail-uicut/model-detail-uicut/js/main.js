/*!
 * Created by 赫连勃格 on 2025/01/01.
 * WX:18900220083
 * QQ:215611388
 * SITE:www.uicut.com
 */
"use strict";

// 通用：弹框关闭
var _this2 = void 0;
$(document).on('click', '.uc-alert .btn-close,.uc-alert .over-close,.uc-alert .js_cancel', function (event) {
  event.preventDefault();
  $(this).parents(".uc-alert").fadeOut('300', function () {
    $(this).removeClass('uc-show');
  });
});

// // 移动菜单：双主菜单
// let alertProductMove = (type = 'in') => {
// 	if (type == 'in') {
// 		$(".alert-product .box").css("left", "-60%");
// 		$(".alert-product").css("display", "block")
// 		$(".alert-product .box").animate({ 'left': '0%' }, 200);
// 		$(".header-phone .btn-product").addClass('on')
// 	} else {
// 		$(".alert-product .box").animate({ 'left': '-60%' }, 200, function() { $(".alert-product").css("display", "none") });
// 		$(".header-phone .btn-product").removeClass('on')
// 	}
// }
// let alertMenuMove = (type = 'in') => {
// 	if (type == 'in') {
// 		$(".alert-menu .box").css("right", "-60%");
// 		$(".alert-menu").css("display", "block")
// 		$(".alert-menu .box").animate({ 'right': '0%' }, 200);
// 		$(".header-phone .btn-menu").addClass('on')
// 	} else {
// 		$(".alert-menu .box").animate({ 'right': '-60%' }, 200, () => { $(".alert-menu").css("display", "none") });
// 		$(".header-phone .btn-menu").removeClass('on')
// 	}
// }
// $("body").on('click', '.header-phone .btn-menu', function(event) {
// 	event.preventDefault();
// 	alertProductMove('out')
// 	let type = $(this).hasClass("on") ? 'out' : 'in'
// 	// let type = $(".alert-menu .box").css('right')=='0px' ? 'out' : 'in'
// 	alertMenuMove(type)
// });
// $("body").on('click', '.header-phone .btn-product', function(event) {
// 	event.preventDefault();
// 	alertMenuMove('out')
// 	let type = $(this).hasClass("on") ? 'out' : 'in'
// 	// let type = $(".alert-product .box").css('left')=='0px' ? 'out' : 'in'
// 	alertProductMove(type)
// });
// $("body").on('click', '.alert-menu .over-close,.alert-product .over-close', function(event) {
// 	event.preventDefault();
// 	alertMenuMove('out')
// 	alertProductMove('out')
// });

// 移动菜单：单主菜单
var alertMenuMove = function alertMenuMove() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'in';
  if (type == 'in') {
    $(".alert-menu .box").css("right", "-60%");
    $(".alert-menu").css("display", "block");
    $(".alert-menu .box").animate({
      'right': '0%'
    }, 200);
    $(".header-phone .btn-menu").addClass('on');
    // $(".header-phone").addClass('on')
  } else {
    $(".alert-menu .box").animate({
      'right': '-60%'
    }, 200, function () {
      $(".alert-menu").css("display", "none");
    });
    $(".header-phone .btn-menu").removeClass('on');
    // $(".header-phone").removeClass('on')
  }
};
$("body").on('click', '.header-phone .btn-menu', function (event) {
  event.preventDefault();
  var type = $(this).hasClass("on") ? 'out' : 'in';
  // let type = $(".alert-menu .box").css('right')=='0px' ? 'out' : 'in'
  alertMenuMove(type);
});
$("body").on('click', '.alert-menu .over-close', function (event) {
  event.preventDefault();
  alertMenuMove('out');
});

// 子菜单
$("body").on('click', '.alert-menu .hasSubMenu>a', function (event) {
  event.preventDefault();
  var _this = $(this).parent();
  if (_this.hasClass('on')) {
    _this.find('.subMenu').slideUp(300);
  } else {
    _this.find('.subMenu').slideDown(300);
    _this.siblings().find('.subMenu').slideUp(300);
  }
  _this.toggleClass('on');
});

// 验证码发送
var timeClock = function timeClock(cls) {
  var _this = cls;
  if (_this.hasClass('disabled')) {
    return false;
  } else {
    _this.addClass('disabled');
    var i = 59;
    var _int = null;
    var clock = function clock() {
      _this.text("\u91CD\u65B0\u53D1\u9001(".concat(i, ")"));
      i--;
      if (i < 0) {
        _this.removeClass('disabled');
        i = 59;
        _this.text("发送验证码(60)");
        clearInterval(_int);
      }
    };
    _int = setInterval(clock, 1000);
    return false;
  }
};
// 发送验证码
$("body").on('click', '.btn-yzm', function (event) {
  event.preventDefault();
  timeClock($('.btn-yzm'));
});
// 窗口变换
var oldW = $(window).width();
$(window).resize(function () {
  // 窗口变换刷新页面
  if ($("body").hasClass('resizeFresh')) {
    location.reload();
  }
  // 只检测宽度变化才刷新
  setTimeout(function () {
    var newW = $(window).width();
    if (oldW != newW) {
      location.reload();
    }
  }, 30);
});
// 滚动
$(window).scroll(function (event) {
  var scrT = $(document).scrollTop();
  // 侧边菜单
  var winH = $(window).height();
  var fH = $("footer").height();
  var docH = $(document).height();
  if (scrT > 205 && $("g-side-menu").height() < docH - scrT - winH - fH / 3) {
    $(".g-side-menu").addClass('fixedTop');
  } else {
    $(".g-side-menu").removeClass('fixedTop');
  }
  // 头部浮动与取消
  if (scrT > 300) {
    $(".header-pc").addClass('fixed');
  } else {
    $(".header-pc").removeClass('fixed');
  }
});
// 滚动消失头部
;
(function () {
  var p = 0,
    t = 0;
  $(window).scroll(function (e) {
    p = $(_this2).scrollTop();
    if (t <= p && p > $(window).height()) {
      // console.log("向下滚")
      $("header,.h98").css("top", "-100%");
    } else {
      // console.log("向上滚")
      $("header,.h98").css("top", "0%");
    }
    setTimeout(function () {
      t = p;
    }, 10);
  });
})();

// // 禁止右键菜单
// document.addEventListener('contextmenu', function(e) {
// 	e.preventDefault();
// });
// // 禁止选中文本（影响复制）
// document.addEventListener('selectstart', function(e) {
// 	e.preventDefault();
// });
// document.addEventListener('keydown', function(e) {
// 	// 禁止 Ctrl+C / Cmd+C（复制）
// 	if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
// 		e.preventDefault();
// 	}
// 	// 禁止 Ctrl+S / Cmd+S（保存网页）
// 	if ((e.ctrlKey || e.metaKey) && e.key === 's') {
// 		e.preventDefault();
// 	}
// 	// 禁止 Ctrl+P / Cmd+P（打印）
// 	if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
// 		e.preventDefault();
// 	}
// });
// // 禁止 F12 / Ctrl+Shift+I / Cmd+Option+I
// document.addEventListener('keydown', function(e) {
// 	if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'I')) || ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'J')) || ((e.ctrlKey || e.metaKey) && e.key === 'U')) {
// 		e.preventDefault();
// 	}
// });