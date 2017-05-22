$(document).ready(function() {
  $("#loginForm").submit(function(e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/ajaxlogin/",
      data: $(this).serialize(),
      success: function(response) {
        if (response == "ok") {
          $("#loginFormButton").html("Signing In ...");
          /*setTimeout("window.location. = '/home/';", 4000);*/
          window.location = "/home/";
        } else {
          $("#loginStatus").fadeIn(1000, function() {
            $("#loginStatus").html('<span class="text-danger">Incorrect username or password.</span>');
          });
        }
      }
    });
  });

  $("#registerForm").submit(function(e) {
    e.preventDefault();
    var keep = $("#registerForm").serialize().split("&")[0]
    var keepo = keep.split("=");
    $.ajax({
      type: "POST",
      url: "/ajaxsignup/",
      data: keepo[1],
      success: function(d) {
        if (d == "False") {
          $("#registerFormButton").html("Signing Up ...");
          /*setTimeout("window.location. = '/home/';", 4000);*/
          window.location = "/home/";
        } else {
          $("#registerStatus").fadeIn(1000, function() {
            $("#registerStatus").html('<span class="text-danger">Username is taken.</span>');
          });
        }
      }
    });
  });

  $("#loginClose").click(function(e) {
    $("#loginForm").find("input[type=text], input[type=password]").val("");
    $("#loginStatus").html('');
  });

  $("#registerClose").click(function(e) {
    $("#registerForm").find("input[type=text], input[type=password]").val("");
    $("#registerStatus").html('');
    clearValidateIcon();
  });

  /* Validate password */
  function validatePassword() {
    if ($("#registerConfirmPassword").val() !== "") {
      group = $("#confirmPasswordGroup");
      icon = $("#confirmPasswordIcon");
      if (!group.hasClass("has-feedback")) {
        group.addClass("has-feedback");
      }
      /* debug to see why wrong passwords are getting checkmarks */
      /* get icon on one line */
      /* genetic cars? */
      if ($("#registerPassword").val() == "" || $("#registerConfirmPassword").val() != $("#registerPassword").val()) {
        console.log(escape($("#registerPassword").val()));
        console.log(escape($("#registerConfirmPassword").val()));
        console.log($("#registerConfirmPassword").val() == $("#registerPassword").val());
        /* Checked that passwords dont match */
        if (group.hasClass("has-success")) {
          group.removeClass("has-success");
        }
        if (icon.hasClass("glyphicon-ok")) {
          icon.removeClass("glyphicon-ok");
        }
        group.addClass("has-error");
        icon.addClass("glyphicon-remove");
        /* Icon formatted, time to show it */
        if (icon.hasClass("hidden")) {
          icon.removeClass("hidden");
        }
        /*icon.css('color', '#cc0000');*/
      } else {
        /* Checked that passwords do match */
        if (group.hasClass("has-error")) {
          group.removeClass("has-error");
        }
        if (icon.hasClass("glyphicon-remove")) {
          icon.removeClass("glyphicon-remove");
        }
        group.addClass("has-success");
        icon.addClass("glyphicon-ok");
        /* Icon formatted, time to show it */
        if (icon.hasClass("hidden")) {
          icon.removeClass("hidden");
        }
        /* icon.css('color', '#00ff4d'); */
      }
    } else {
      clearValidateIcon();
    }
  }

  function clearValidateIcon() {
    group = $("#confirmPasswordGroup");
    icon = $("#confirmPasswordIcon");
    if (group.hasClass("has-feedback")) {
      group.removeClass("has-feedback");
    }
    if (group.hasClass("has-error")) {
      group.removeClass("has-error");
    }
    if (group.hasClass("has-success")) {
      group.removeClass("has-success");
    }
    if (icon.hasClass("glyphicon-ok")) {
      icon.removeClass("glyphicon-ok");
    }
    if (icon.hasClass("glyphicon-remove")) {
      icon.removeClass("glyphicon-remove");
    }
    icon.addClass("hidden");
  }

  $("#registerConfirmPassword").keyup(function(e) {
    validatePassword();
  });

  $("#registerPassword").keyup(function(e) {
    validatePassword();
  });
});
