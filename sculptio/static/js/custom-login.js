$(document).ready(function() {

  $("#loginForm").submit(function(e) {
    e.preventDefault();
    //console.log($(this).serialize());
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

  $("#loginClose").click(function(e) {
    $("#loginForm").find("input[type=text], input[type=password]").val("");
    $("#loginStatus").html('');
  });

});
