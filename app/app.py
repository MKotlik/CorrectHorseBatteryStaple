# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# app.py - main server module

# TODO: need some form of protection for socketio connections
# TODO: need custom 404 page, and other HTTP error handling


from flask import Flask, render_template, request, session, url_for, redirect
from utils import database
from flask_socketio import SocketIO, emit, send

app = Flask(__name__)
app.secret_key = "horses"
socketio = SocketIO(app)


# ===== PROJECT STATE GLOBALS ===== #

clients_rooms = {}  # Maps clientIDs to room names (projIDs)
rooms_projects = {}  # Maps room names (projIDs) to (collaborators, proj_dict)
clients_usernames = {}  # Maps clientIDs to usernames


# ===== ON STARTUP ===== #

@app.before_first_request
def initserver():
    print "sculpt.io: Initializing database"
    database.initdb()
    print "sculpt.io: Database initialized"


# ===== VISIBLE ROUTES ===== #

@app.route("/")
def root():
    '''Redirects to home'''
    return redirect(url_for('home'))


@app.route("/home/")
def home():
    '''Displays the homepage, diff versions based on login status'''
    if is_logged_in():
        return render_template('home_user.html')
    else:
        return render_template('home_public.html')


@app.route("/login/")
def login():
    '''Displays login form, actual login processing happens thru ajax'''
    return render_template('login.html')


@app.route("/signup/")
def signup():
    '''Displays sign up form, actual processing happens thru ajax'''
    return render_template('signup.html')


@app.route("/logout/")
def logout():
    '''If logged in, logs user out, redirects to home'''
    if is_logged_in():
        session.pop('username')
    return redirect(url_for('home'))


@app.route("/project/<projID>")
def project(projID):
    '''Displays editor for project specified by projID
    projID is generated when a new project is created'''
    if not is_logged_in():
        return redirect(url_for('login'))
    pass


@app.route("/profile/")
def profile():
    '''Displays the profile of the currently logged in user'''
    # NOTE: Shows a "please log in" page or redirects to login if not logged in
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('profile.html')


@app.route("/search/<query>")
def search(query):
    '''Displays search results for given query'''
    # NOTE: should we have a search page w/o query as well? (/search/)
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('search.html')


@app.route("/test/")
def test():
    return render_template('editor.html')


# ===== AJAX ROUTES ===== #

@app.route("/ajaxlogin/", methods=["POST"])
def ajaxlogin():
    '''Endpoint for ajax login POST request
    Takes and validates a username and password
    Returns: "ok" if account exists and login info matches
             "mismatch" if password mismatch or nonexistent account
    '''
    username = request.form["username"]
    password = request.form["password"]
    if database.is_login_valid(username, password):
        session['username'] = username
        return "ok"
    else:
        return "mismatch"


@app.route("/ajaxsignup/", methods=["POST"])
def ajaxsignup():
    '''Endpoint for ajax sign up POST request
    Takes and validates a username and password
    Returns: "ok" if account created successfully
             "taken" if given username is already taken
             "badpass" if password doesn't match requirements
    '''
    username = request.form["username"]
    password = request.form["password"]
    # Check if password meets reqs (in addition to client-side check)
    if database.does_user_exist(username):
        return "taken"
    elif not is_password_valid(password):
        return "badpass"
    else:
        database.add_user(username, password)
        # Automatically log user in
        session['username'] = username
        # Return "ok" to perform client-side redirect
        return "ok"


# ===== SOCKETIO ENDPOINTS ===== #

@socketio.on('user_connect')
def handle_connection(socket):
    pass


@socketio.on('proj_request')
def handle_proj_request(proj_request):
    pass


@socketio.on('user_disconnect')
def handle_disconnect(data):
    pass


@socketio.on('meta_change')
def handle_meta_change(change_data):
    pass


@socketio.on('save_project')
def handle_save(save_data):
    pass


# ===== LOGIN HELPERS ===== #

def is_logged_in():
    return "username" in session


def get_username():
    return session["username"]


def is_password_valid(password):
    # Currently password length is only req, but can expand
    return len(password) >= 8


# -- run module -- #

if __name__ == "__main__":
    socketio.run(app, debug=True)
