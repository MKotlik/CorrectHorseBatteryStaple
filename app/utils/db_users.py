# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# dbUsers.py - user-related mongoDB interactions

from pymongo import MongoClient
import hashlib
import datetime

# TODO: notify connected users if they get request or are added to proj
# NOTE: cannot transfer ownership as of now. Might be possible later.

# ===== DATABASE SCHEMA ===== #
'''
users collection:
- each user document contains:
    - username
    - password
    - ownedIDs (list of projIDs of projects created by this user)
    - permissions (list of tuples of (projID, permission) for this user,
        excluding the projects that they own)
    - contributedIDs (list of projIDs of projects contributed to by this user,
        including the projects that they own)
    - incomingRequests (list of join requests for projects owned by user,
        each request is a tuple of (sendingUser, projID, timeSent))
    - outgoingRequests (list of sent join requests for other projects,
        each request is a tuple of (receivingUser, projID, timeSent))
    - notifications (list of tuples of notif msgs (msg, timeReceived),
        most msgs are project invite related)
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
    '''Checks whether a user with given name exists in the database'
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
    """
    # Check performed in does_user_exist
    if users.find({'username': username}).count() > 0:
        client.close()
        return False
    """
    hashed_pass = hash_password(password)
    new_user = {"username": username, "password": hashed_pass,
                "ownedIDs": [], "contributedIDs": [], "permissions": [],
                "incomingRequests": [], "outgoingRequests": [],
                "notifications": []}
    users.insert_one(new_user)
    client.close()
    return True


def hash_password(unhashed):
    '''Returns a salted and md5 hashed version of the password'''
    return hashlib.md5("2017horsesW/StapledCorrect" + unhashed).hexdigest()


# ===== USER FUNCTIONS ===== #

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


def add_owned_proj(username, projID):
    '''Adds projID of a user's owned project to their database entry
    Args: username(str), projID (int)
    Returns: True if user found and updated, False otherwise (bool)
    '''
    client = MongoClient()
    users = client["sculptio"].users
    # Add projID to ownedIDs list only if it isn't already in the set
    update_result = users.update_one({'username': username},
                                     {"$addToSet": {"ownedIDs": projID}})
    print update_result
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
