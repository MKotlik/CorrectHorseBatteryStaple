# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# dbUsers.py - user-related mongoDB interactions

from pymongo import MongoClient
import hashlib
import datetime

# TODO: notify users of requests or notifications by sockets
# TODO: refactor repetitive code (esp. permissions & general mongo overhead)
# NOTE: cannot transfer ownership as of now. Might be possible later.

# ===== DATABASE SCHEMA ===== #
'''
users collection:
- each user document contains:
    - username
    - password
    - ownedIDs (list of projIDs of projects created by this user)
    - permissions (dict of permissions for for this user, with projID as key,
        and permission level as value, excluding the projects that they own)
    - contributedIDs (list of projIDs of projects contributed to by this user,
        including the projects that they own)
    - incomingRequests (list of join requests for projects owned by user,
        each request is a tuple of (sendingUser, projID, timeSent))
    - outgoingRequests (list of sent join requests for other projects,
        each request is a tuple of (receivingUser, projID, timeSent))
    - notifications (list of tuples of notif msgs (msg, timeReceived),
        most msgs are project invite related)
    - hasUnread (bool marking presence of unread notifs)
- projIDs are used to retrieve a user's projects from the projects collection
'''


# ===== LOGIN/REGISTER FUNCTIONS ===== #

def is_login_valid(username, password):
    '''Checks if given credentials match an existing user in the db
    Args: username (str), password (str)
    Returns: boolean
    '''
    client = MongoClient()
    users = client["sculptio"].users
    cursor = users.find({'username': username})  # Cursor of matching users
    if cursor.count() > 0:  # If user with given name exists
        existing_pass = cursor[0]['password']  # Get pass of first & only user
        hashed_pass = hash_password(password)
        client.close()
        return hashed_pass == existing_pass
    else:  # If no user exists with given name
        client.close()
        return False


def does_user_exist(username):
    '''Checks whether a user with given name exists in the database
    Args: username (str), password (str)
    Returns: boolean
    '''
    client = MongoClient()
    users = client["sculptio"].users
    result = users.find({'username': username}).count() > 0
    client.close()
    return result


def add_user(username, password):
    '''Registers the given user in the MongoDB database
    Args: username (str), password (str)
    Password: true if username unique & user created, false otherwise (bool)
    '''
    client = MongoClient()
    db = client["sculptio"]
    users = db["users"]
    hashed_pass = hash_password(password)
    new_user = {"username": username, "password": hashed_pass,
                "ownedIDs": [], "contributedIDs": [], "permissions": {},
                "incomingRequests": [], "outgoingRequests": [],
                "notifications": [], "hasUnread": False}
    users.insert_one(new_user)
    client.close()
    return True


def hash_password(unhashed):
    '''Returns a salted and md5 hashed version of the password'''
    return hashlib.md5("2017horsesW/StapledCorrect" + unhashed).hexdigest()


# ===== PROJECT-RELATED FUNCTIONS ===== #

def add_owned_proj(username, projID):
    '''Adds projID of a user's owned project to their database entry
    Args: username(str), projID (int)
    Returns: True if user found and updated, False otherwise (bool)
    '''
    # TODO: consider merging this into add_project & creating change_owner()
    client = MongoClient()
    users = client["sculptio"].users
    # Add projID to ownedIDs list only if it isn't already in the set
    update_result = users.update_one({'username': username},
                                     {"$addToSet": {"ownedIDs": projID}})
    client.close()
    if update_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to add previously attributed proj to user"
        return True


def add_contributed_proj(username, projID):
    '''Adds projID of a project the user contributed to to their database entry
    Args: username(str), projID (int)
    Returns: True if user found and updated, False otherwise (bool)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    # Add projID to ownedIDs list only if it isn't already in the set
    update_result = users.update_one({'username': username},
                                     {"$addToSet": {"contributedIDs": projID}})
    client.close()
    if update_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to add previously attributed proj to user"
        return True


# ===== REQUEST-RELATED FUNCTIONS ===== #

def issue_request(requester, owner, projID):
    '''
    Adds collaboration request for proj to requester's & owner's request lists
    Args: requester (str), owner (str), projID (int)
    Returns: True if users found and updated, False otherwise (bool)
    '''
    request = [requester, owner, projID]
    client = MongoClient()
    users = client["sculptio"].users
    # Add request to project owner's incomingRequests list
    owner_result = users.update_one({'username': owner},
                                    {"$addToSet": {"incomingRequests": request}})
    # Add request to requester's outgoingRequests list
    requester_result = users.update_one({'username': requester},
                                        {"$addToSet": {"outgoingRequests": request}})
    client.close()
    if owner_result.matched_count == 0 or requester_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to add previously issued request"
        return True


def cancel_request(requester, owner, projID):
    '''
    Removes collaboration request from requester's & owner's request lists
    Args: requester (str), owner (str), projID (int)
    Returns: True if users found and updated, False otherwise (bool)
    '''
    request = [requester, owner, projID]
    client = MongoClient()
    users = client["sculptio"].users
    # Remove request from project owner's incomingRequests list
    owner_result = users.update_one({'username': owner},
                                    {"$pull": {"incomingRequests": request}})
    # Remove request from requester's outgoingRequests list
    requester_result = users.update_one({'username': requester},
                                        {"$pull": {"outgoingRequests": request}})
    client.close()
    if owner_result.matched_count == 0 or requester_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to remove nonexistent request"
        return True


def accept_request(requester, owner, projID, level="edit"):
    '''
    Adds permission for proj & level to requester, notifies them, and
    removes requests.
    Args: requester (str), onwer (str), projID (int), level (str) [opt]
    Returns: True if users found and updated, False otherwise (bool)
    '''
    # Gives requester edit permissions by default
    # NOTE: should we check whether the request is in the db? or assume right?
    request = [requester, owner, projID]
    client = MongoClient()
    users = client["sculptio"].users
    # Add permission to requester's permission's set
    proj_q = 'permissions.' + str(projID)
    requester_result = users.update_one({'username': requester},
                                        {"$set": {proj_q: level}})
    # Remove request from requester's outgoingRequests list
    users.update_one({'username': requester},
                     {"$pull": {"outgoingRequests": request}})
    # Add notification about request acceptance to user's notif list
    notification = (owner, projID, level, datetime.datetime.utcnow())
    users.update_one({'username': requester},
                     {"$addToSet": {"notifications": notification}})
    # Increments unread notification count
    users.update_one({'username': requester},
                     {"$set": {"hasUnread": True}})
    # Remove request from project owner's incomingRequests list
    owner_result = users.update_one({'username': owner},
                                    {"$pull": {"incomingRequests": request}})
    client.close()
    if requester_result.matched_count == 0 or owner_result.matched_count == 0:
        return False
    else:
        # if requester_result.modified_count == 0:
        # print "NOTICE: attempted to accept nonexistent or accepted request
        return True


# ===== PERMISSION-RELATED FUNCTIONS ===== #

def update_permissions(permitee, owner, projID, level):
    '''
    Updates permitee's permission for given project, notifies them.
    Args: requester (str), onwer (str), projID (int), level (str)
    Returns: True if permitee found and updated, False otherwise (bool)
    '''
    permission = (projID, level)
    client = MongoClient()
    users = client["sculptio"].users
    proj_q = 'permissions.' + str(projID)
    update_result = users.update_one({'username': permitee},
                                     {'$set': {proj_q: level}})
    # Add notification about permissions change to user's notif list
    notification = (owner, projID, level, datetime.datetime.utcnow())
    users.update_one({'username': permitee},
                     {"$addToSet": {"notifications": notification}})
    # Increments unread notification count
    users.update_one({'username': permitee},
                     {"$set": {"hasUnread": True}})
    client.close()
    if update_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to changed nonexistent or same permission
        return True


def remove_permissions(permitee, projID, ownwer=""):
    '''
    Removes permitee's permission to collaborate on given proj
    Args: requester (str), onwer (str), projID (int)
    Returns: True if permitee found and updated, False otherwise (bool)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    proj_q = 'permissions.' + str(projID)
    # The value used in the unset query doesn't matter
    update_result = users.update_one({'username': permitee},
                                     {'$unset': {proj_q: ""}})
    # TODO: notify user about permission removal!!!
    client.close()
    if update_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to changed nonexistent permission
        return True


# ===== NOTIFICATON-RELATED FUNCTIONS ===== #

def get_has_unread(username):
    '''
    Get whether user has unread notifications
    Args: username (str)
    Returns: tuple containing success report and data dict (boolean, dict)
    '''
    (search_status, user) = get_user_data(username)
    if search_status is False:
        return (False, None)  # THIS IS A NONE VALUE, WATCH OUT
    else:
        return (True, user["hasUnread"])


def update_has_unread(username):
    '''
    Marks user's notifications as all read
    Args: username (str)
    Returns: tuple containing success report and data dict (boolean, dict)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    update_result = users.update_one({'username': username},
                                     {"$set": {"hasUnread": False}})
    client.close()
    if update_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to set user's hasUnread to current value"
        return True


# ===== USER ACCOUNT FUNCTIONS ===== #

def get_user(username):
    '''Retrieves a dict with the specified user's data from the database
    Args: username (str)
    Returns: tuple containing success report and data dict (boolean, dict)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    user_cursor = users.find({'username': username})
    if user_cursor.count() == 0:
        result = (False, {})
    else:
        result = (True, user_cursor[0])
    client.close()
    return result


def get_user_data(username):
    '''Returns the user's non-sensitive data, excludes auth info
    Args: username (str)
    Returns: tuple containing success report and data dict (boolean, dict)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    user_cursor = users.find({'username': username})
    if user_cursor.count() == 0:
        result = (False, {})
    else:
        data = {i: user_cursor[0][i]
                for i in user_cursor[0] if i != "password"}
        result = (True, data)
    client.close()
    return result


def get_users():
    '''Retrieves list of all users in the database
    Returns: tuple containing success report and list of users (bool, dict)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    user_cursor = users.find({})
    result = list(user_cursor)
    client.close()
    return result


def update_password(username, password):
    '''Updates the specified user's password.
    Args: username (str), password (str)
    Returns: True if user found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    hashed_pass = hash_password(password)
    update_result = users.update_one({'username': username},
                                     {"$set": {"password": hashed_pass}})
    client.close()
    if update_result.modified_count == 0:
        return False
    else:
        return True


def remove_user(username):
    '''Removes the specified user
    Args: username (str)
    Returns: True if user found & deleted, False otherwise (bool)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    delete_result = users.delete_one({'username': username})
    client.close()
    if delete_result.deleted_count == 0:
        return False
    else:
        return True
