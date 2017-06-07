
# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# app.py - main server module

# TODO: need some form of protection for socketio connections
# TODO: need custom 404 page, and other HTTP error handling
# NOTE: we're going to need a lot more ajax endpoints


from flask import Flask, render_template, request, session, url_for, redirect
from utils import db_general, db_users, db_projects
from flask_socketio import SocketIO, emit, send, join_room, leave_room
import datetime

app = Flask(__name__)
app.secret_key = "horses"
socketio = SocketIO(app)


# ===== PROJECT STATE GLOBALS ===== #

users_rooms = {}  # Maps clientIDs to room names (projIDs)
rooms_projects = {}  # Maps room names (projIDs) to (collaborators, proj_dict)
users_sockets = {} # Maps clientIDs to socket connections


# ===== ON STARTUP ===== #

@app.before_first_request
def initserver():
    print "sculpt.io: Initializing database"
    db_general.initdb()
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
        return render_template('home_user.html', owned_projects=display_projects(session['username']), permitted_projects=display_contributions(session['username']))
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


@app.route("/create/")
def create():
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('create.html')


@app.route("/project/<projID>/")
def project(projID):
    '''Displays editor for project specified by projID
    projID is generated when a new project is created'''
    if not is_logged_in():
        return redirect(url_for('login'))
    else:
        project=db_projects.get_project(projID)
        return render_template('project.html',project_name="placeholder"+str(project))


@app.route("/settings/")
def profile():
    '''Displays the settings for the currently logged in user'''
    # NOTE: Shows a "please log in" page or redirects to login if not logged in
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('settings.html')


@app.route("/search/")
def search():
    '''Displays search results for given query'''
    # NOTE: should we have a search page w/o query as well? (/search/)
    query = request.args.get("query")
    if not is_logged_in():
        return redirect(url_for('login'))
    if query == '':
        return redirect(url_for('home'))
    else:
        results = [project for project in db_projects.get_projects() if
                   (query in project['name'].split()
                    or query in project['description'].split()
                    or query in project['owner'].split()
                    or any(query in personlist.split() for personlist in project['contributors']))]
        resultstring = ''
        for project in results:
            resultstring += '<a href="/project/' + \
                str(project['projID']) + '" class="list-group-item">' + \
                project['name'] + (20 * '&nbsp') + 'Owner: ' + \
                project['owner'] + '</a>\n'
        return render_template('search.html', query=query, results=resultstring)


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
    if db_users.is_login_valid(username, password):
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
    confirmPassword = request.form["confirmPassword"]
    # Check if password meets reqs (in addition to client-side check)
    if db_users.does_user_exist(username):
        return "taken"
    elif not is_password_valid(password, confirmPassword):
        return "badpass"
    else:
        db_users.add_user(username, password)
        # Automatically log user in
        session['username'] = username
        # Return "ok" to perform client-side redirect
        return "ok"


@app.route("/ajaxchangepassword/", methods=["POST"])
def ajaxchangepassword():
    username = session["username"]
    newPassword = request.form["newPassword"]
    confirmNewPassword = request.form["confirmNewPassword"]

    if not is_password_valid(newPassword, confirmNewPassword):
        return "badpass"
    else:
        db_users.update_password(username, newPassword)
        return "ok"


@app.route("/ajaxcreate/", methods=["POST"])
def ajaxcreate():
    '''Endpoint for ajax create project POST request
    Takes project name, access_rights, visibility, and optionally description
    and collaborators and creates the correspondng project.
    Returns: "ok: <projID>" if project successfully created
             "missing: <username>" for a nonexistent collaborator
    '''
    name = request.form['name']
    # NOTE: check for project name collision?
    # "taken" if users owns a project with the same name
    owner = session['username']

    collab_string = request.form['collaborators']  # Default to edit rights
    # Strip by commas and remove whitespace
    collab_list = [user.strip() for user in collab_string.split(',')]
    # Check that all collaborators exist
    print collab_list
    for user in collab_list:
        if user != '' and not db_users.does_user_exist(user):
            return 'missing: ' + user
    # Create dictionary with edit as default permission
    permissions = {user: 'edit' for user in collab_list}

    description = request.form['description']
    # Using this to convert from string to boolean
    access_rights = (request.form['accessRights'] == 'public')
    # visible = (request.form['visible'] == 'True')

    projID = db_projects.add_project(name, owner, description, access_rights,permissions)[1]['projID']
    return 'ok: ' + str(projID)


# ===== SOCKETIO ENDPOINTS ===== #

@socketio.on('user_connect')
def handle_connection(projID):
    print "SCULPTIO: received user_connect event"
    if 'username' not in session:
        print "SCULPTIO: user rejected because not authenticated"
        return False
    # Continue if authenticated (assume that accessed thru project page)
    # Check for user's permission to access project in the app route, not here
    username = session['username']
    print "SCULPTIO: user %s connected" % username
    if username in users_rooms:
        print 'SCULPTIO: user connected but already in users_rooms'
        if projID != users_rooms[username]:  # If prev project isnt this one
            room = str(users_rooms[username])
            if cleanup_on_disconnect(username):
                socketio.emit('user_leave', {'username': username}, room=room)
    join_room(str(projID))
    users_rooms[username] = projID
    users_sockets[username] = request.sid
    if projID not in rooms_projects:  # Aka this is first user for this proj
        # Technically should check operation status here (future feature?)
        print 'fetching project from db'
        proj = db_projects.get_project(projID)[1]
        proj['active_users'] = [username]
        rooms_projects[projID] = proj
    else:
        # Add user to list of users currently active on this proj
        print 'adding user to active users'
        rooms_projects[projID]['active_users'].append(username)
        proj = rooms_projects[projID]
    response = {
        'grainIndices': list(proj['sculpture']) if 'sculpture' in proj else []
    }
    # Giving username and grains to user
    # !!! TRIGGERS COMPLETE PULL IN EVERY USER !!! WIP
    socketio.emit('complete_pull', response, room=users_sockets[username])
    # Notify all collaborators about the newly joined user WIP
    # socketio.emit('user_join', username, room=str(projID))
    print 'SCULPTIO: completed user connection'


@socketio.on('user_disconnect')
def handle_disconnect(data):
    if 'username' not in session:
        return False
    username = session['username']
    if username in users_rooms:
        room = str(users_rooms[username])
        if cleanup_on_disconnect(username):
            socketio.emit('user_leave', {'username': username}, room=room)


@socketio.on('meta_change')
def handle_meta_change(data):
    pass


@socketio.on('complete_push')
def handle_save(grainsList):
    if 'username' not in session:
        return False
    username = session['username']
    print "SOCKETIO: got a complete_push"
    projID = users_rooms[username]
    proj = rooms_projects[str(projID)]
    proj['sculpture'] = set(grainsList)
    proj['timeLastSaved'] = datetime.datetime.utcnow()
    db_projects.update_sculpture(projID, grainsList)
    print "SOCKETIO: saved project"
    # socketio.emit('saved', {'username': username}, room=str(projID))


@socketio.on('partial_push')
def handle_update(data):
    if 'username' not in session:
        return False

    username = session['username']
    print "SOCKETIO: got a partial_push"
    projID = users_rooms[username]
    proj = rooms_projects[projID]

    if 'sculpture' not in proj:
        proj['sculpture'] = set()

    for grain in data['added']:
        proj['sculpture'].add(grain)

    for grain in data['removed']:
        proj['sculpture'].remove(grain)

    print "SOCKETIO: updated sculpture in memory"

    socketio.emit('partial_pull', data)
    print "SOCKETIO: passed a partial_push"


@socketio.on('perm_request')
def handle_perm_request(data):
    pass


@socketio.on('accept_request')
def handle_accept_request(data):
    pass


@socketio.on('notif_read')
def handle_notif_read(data):
    pass


# ===== SOCKET HELPERS ===== #

def cleanup_on_disconnect(username):
    projID = users_rooms[username]
    print projID
    users_rooms.pop(username)
    proj = rooms_projects[projID]
    if len(proj['active_users']) >= 2:
        proj['active_users'].remove(username)
        return False
    else:
        db_projects.update_sculpture(projID, proj['sculpture'])
        rooms_projects.pop(projID)
        return True


# ===== LOGIN HELPERS ===== #

def is_logged_in():
    return "username" in session


def get_username():
    return session["username"]


def is_password_valid(password, confirmPassword):
    # Currently password length is only req, but can expand
    return (len(password) >= 8) and (password == confirmPassword)

# ===== DISPLAY HELPERS ===== #


def display_projects(username):  # displays a user's own projects
    own_projects = db_users.get_owned_projects(username)
    print own_projects
    retstr = ''
    for project in own_projects[1]:
        retstr += '<a href="/project/' + \
            str(project['projID']) + '" class="list-group-item">' + \
            project['name'] + '</a>\n'
    print retstr
    return retstr


# displays projects that a user can contribute to
def display_contributions(username):
    allowed_projects = db_users.get_permitted_projects(username)
    retstr = ''
    for project in allowed_projects[1]:
        retstr += '<a href="/project/' + \
            str(project['projID']) + '" class="list-group-item">' + \
            'Name: ' + project['name'] + (20 * '&nbsp') + \
            'Owner: ' + project['owner'] + '</a>\n'
    print retstr
    return retstr


# -- run module -- #

if __name__ == "__main__":
    socketio.run(app, debug=True)

# === UNUSED CODE ===

#
#
# @app.route("/profile/")
# def profile():
#     '''Displays the profile of the currently logged in user'''
#     # NOTE: Shows a "please log in" page or redirects to login if not logged in
#     if not is_logged_in():
#         return redirect(url_for('login'))
#     return render_template('profile.html')
