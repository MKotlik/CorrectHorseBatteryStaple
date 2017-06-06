$(document).ready(function() {

  $("#createForm").submit(function(e) {
    e.preventDefault();
    //console.log($(this).serialize());
    $.ajax({
      type: "POST",
      url: "/ajaxcreate/",
      data: $(this).serialize(),
      success: function(response) {
        console.log(response)
        if (response.startsWith("ok")) {
          console.log('should create project')
          // The response is of the format "ok: <projID>"
          $("#createButton").html("Creating ...");
          /*setTimeout("window.location. = '/home/';", 4000);*/
          var projIDStr = response.substring(4)
          window.location = "/project/" + projIDStr + "/"
        } else {
          // The response is of the format "missing: <username>"
          // Sent when a nonexistent collaborator is added'
          var missingUser = response.substring(9)
          $("#createStatus").fadeIn(1000, function() {
            $("#createStatus").html('<span class="text-danger">User doesn\'t exist: ' + missingUser + '</span>');
          });
        }
      }
    });
  });

});
