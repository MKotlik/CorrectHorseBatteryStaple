$(document).ready(function() {

  $("#change-password").submit(function(e) {
    e.preventDefault();
    //var keep = $("#registerForm").serialize().split("&")[0]
    //var keepo = keep.split("=");
    console.log($(this).serialize());
    $.ajax({
      type: "POST",
      url: "/ajaxchangepassword/",
      //data: keepo[1],
      data: $(this).serialize(),
      success: function(response) {
        if (response == "ok") {
          $("#change-button").html("Signing Up ...");
          /*setTimeout("window.location. = '/home/';", 4000);*/
          window.location = "/home/";
        } else {
          //Implies "badpass" response status
          $("#change-status").fadeIn(1000, function() {
            $("#change-status").html('<span class="text-danger">Password is too short.</span>');
          });
        }
      }
    });
  });

  /* Validate password */
  function validatePassword() {
    if ($("#change-new-confirm-password").val() !== "") {
      group = $("#change-confirm-password-group");
      icon = $("#confirm-password-icon");
      if (!group.hasClass("has-feedback")) {
        group.addClass("has-feedback");
      }
      /* debug to see why wrong passwords are getting checkmarks */
      /* get icon on one line */
      /* genetic cars? */
      if ($("#change-new-password").val() == "" || $("#change-new-confirm-password").val() != $("#change-new-password").val()) {
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
    group = $("#change-confirm-password-group");
    icon = $("#confirm-password-icon");
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

  $("#change-new-confirm-password").keyup(function(e) {
    validatePassword();
  });

  $("#change-new-password").keyup(function(e) {
    validatePassword();
  });
});
