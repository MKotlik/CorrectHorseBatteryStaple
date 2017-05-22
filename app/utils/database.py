# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# database.py - mongoDB interactions

from pymongo import MongoClient
import hashlib
import datetime

''' # ===== DATABASE SCHEMA ===== #
users collection:
- each user document contains:
    - username
    - password
    - ownedIDs (list of projIDs of projects created by this user)
    - contributedIDs (list of projIDs of projects contributed to by this user)
- projIDs are used to retrieve a user's projects from the projects collection

projects collection:
- each project document contains:
    - projID (unique numerical identifier for this project)
    - projectName (non-unique name for this project)
    - ownerName (username of project creator)
    - contributorNames (list of usernames of contributors to project)
    - creationTime (datetime-formatted time of when project was created)
    - sculpture (some representation of the actual model)
    - lastSaveTime (datetime-formatted time of last save to database)
    - description (description of project)
- each project COULD also contain:
    - access_rights (public - anyone can join as a contributor, or private -
        only by invitation)
    - editHistory (dict or list of edits made between saves [differences
        between saves], so that changes could be rolled back. Like git.)

lastprojid collection:
- contains a single document to keep track of last assigned projID:
    - id (the projID of the most recently created project)
- since projIDs are consecutive integers starting with 0, lastprojid can be
    used to get the total number of projects created
'''


# ===== GENERAL DATABASE FUNCTIONS ===== #

def initdb():
    '''Creates the sculptio database with the users and projects collections.
    Creates indices based on the 'username' and 'projID' fields respectively,
    to allow for faster collection traversal.
    Returns: boolean
    '''
    client = MongoClient()
    db = client.sculptio  # Create the database in the server
    users = db.users  # Create the users collection
    projects = db.projects  # Create the projects collection
    lastprojid = db.lastprojid  # Create the lastprojid collection

    # Create indices for faster traversal, in ascending order
    # For development, indices are unique to catch duplicate insertion attempts
    resultU = users.create_index('username', unique=True)
    resultP = projects.create_index('projID', unique=True)

    # Insert a starting id of 0 into lastprojid
    lastprojid.insert_one({"ID": 0})

    client.close()
    # PyMongo should throw error on failure, but return success as well
    return resultU == 'username_1' and resultP == 'projID_1'


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
                "ownedIDs": [], "contributedIDs": []}
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


# ===== PROJECT FUNCTIONS ===== #

def get_project(projID):
    '''Retrieves the specified project from the database.
    Args: projID (int)
    Returns: tuple containing success report and data dict (boolean, dict)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    proj_cursor = projects.find({'projID': projID})
    if proj_cursor.count() == 0:
        result = (False, {})
    else:
        result = (True, proj_cursor[0])
    client.close()
    return result


def add_project(name, owner, description=''):
    '''Creates a new project, adds to database and returns it.
    Args: name (str), owner (str), [optional] description (str)
    Returns: a tuple containing success status (bool) and the project (dict)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    lastprojid = client["sculptio"].lastprojid
    new_projID = lastprojid.find({})[0]["ID"] + 1  # Pull & inc for new id
    lastprojid.update_one({}, {"$inc": {"ID": 1}})  # increment ID in db
    time_now = datetime.datetime.utcnow()
    project_dict = {"projID": new_projID, "name": name, "owner": owner,
                    "description": description, "contributors": [owner],
                    "timeCreated": time_now, "timeLastSaved": time_now}
    project_dict["sculpture"] = [[]]  # Blank 2d array for now
    projects.insert_one(project_dict)
    return (True, project_dict)


def add_contributor(projID, username):
    client = MongoClient()
    projects = client["sculptio"].projects
    # Add username to contributors list only if it isn't already in the set
    update_result = projects.update_one({'projID': projID},
                                        {"$addToSet": {"contributors": username}})
    client.close()
    if update_result.matched_count == 0:
        return False
    else:
        # if update_result.modified_count == 0:
        # print "NOTICE: attempted to add previously attributed user to proj"
        return True


def update_description(projID, description):
    '''Updates the specified project's description.
    Args: projID (int), description (str)
    Returns: True if project found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    update_result = projects.update_one({'projID': projID},
                                        {"$set": {"description": description}})
    client.close()
    if update_result.modified_count == 0:
        return False
    else:
        return True


def update_project_name(projID, name):
    '''Updates the specified project's name.
    Args: projID (int), name (str)
    Returns: True if project found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    update_result = projects.update_one({'projID': projID},
                                        {"$set": {"name": name}})
    client.close()
    if update_result.modified_count == 0:
        return False
    else:
        return True


def update_sculpture(projID, sculpture):
    '''Updates the specified project's sculpture array & save time, returns
        a copy of the project as a dict.
    Args: projID (int), sculpture (list of tuples)
    Returns: tuple containing success status (bool) and the project (dict)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    time_now = datetime.datetime.utcnow()
    update_result = projects.update_one({'projID': projID},
                                        {"$set": {"sculpture": sculpture,
                                                  "timeLastSaved": time_now}})
    if update_result.modified_count == 0:
        client.close()
        return (False, {})
    else:
        updated_dict = projects.find({"projID": projID})[0]
        client.close()
        return (True, updated_dict)


# ===== CURRENTLY UNIMPLEMENTED FUNCTIONS ===== #

"""
def update_project(projID, name=None, owner=None, contributors=None,
                   description=None, sculpture=None):
    pass


# ===== PROJID FUNCTIONS ===== #

def get_last_projID():
    pass


def inc_last_projID():
    pass
"""

# ===== UNUSED FUNCTIONS ===== #

"""
"""
