# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# database.py - mongoDB interactions

from pymongo import MongoClient
import hashlib

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
    - sculptObject (some representation of the actual model)
    - lastSaveTime (datetime-formatted time of last save to database)
    - description (description of project)
- each project COULD also contain:
    - editHistory (dict or list of edits made between saves [differences
        between saves], so that changes could be rolled back. Like git.)
'''

DEBUG = True


def initdb():
    # NOTE: can I create an index if I dont have the needed fields?
    client = MongoClient()
    db = client.sculptio  # Create the database in the server
    users = db.users  # Create the users collection
    projects = db.projects  # Create the projects collection
    # Create indices for faster traversal
    resultU = users.create_index('username')
    resultP = projects.create_index('projID')
    client.close()
    if DEBUG:
        print "Result of user indices creation: "
        print resultU
        print "Result of project indices creation: "
        print resultP


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


def register_user(username, password):
    '''Registers the given user in the MongoDB database
    Args: username (str), password (str)
    '''
    hashed_pass = hash_password(password)
    new_user = {"username": username, "password": hashed_pass,
                "ownedIDs": [], "contributedIDs": []}
    client = MongoClient()
    db = client["sculptio"]  # access db, or create it if it doesn't exist
    users = db["users"]
    users.insert_one(new_user)
    client.close()


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


def hash_password(unhashed):
    '''Returns a salted and md5 hashed version of the password'''
    return hashlib.md5("2017horsesW/StapledCorrect" + unhashed).hexdigest()
