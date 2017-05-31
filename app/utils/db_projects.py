# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# database.py - project-related mongoDB interactions

from pymongo import MongoClient
import datetime

# ===== DATABASE SCHEMA ===== #
'''
projects collection:
- each project document contains:
    - projID (unique numerical identifier for this project)
    - name (non-unique name for this project)
    - owner (username of project creator)
    - contributors (list of usernames of contributors to project)
    - timeCreated (datetime-formatted time of when project was created)
    - sculpture (some representation of the actual model)
    - timeLastSaved (datetime-formatted time of last save to database)
    - description (description of project)
    - accessRights (true if public - anyone can join as a contributor,
        or false if private - only by invitation)
    - permittedUsers (list users with edit permissions (view, edit),
        excluding owner)
    - visibile (true if visible to public [default], false if hidden)
- each project COULD also contain:
    - editHistory (dict or list of edits made between saves [differences
        between saves], so that changes could be rolled back. Like git.)

lastprojid collection:
- contains a single document to keep track of last assigned projID:
    - id (the projID of the most recently created project)
- since projIDs are consecutive integers starting with 0, lastprojid can be
    used to get the total number of projects created
'''


# ===== OBJECT & CREATION FUNCTIONS ===== #

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
                    "timeCreated": time_now, "timeLastSaved": time_now,
                    "accessRights": False, "visibile": True,
                    "permittedUsers": {}}
    project_dict["sculpture"] = [[]]  # Blank 2d array for now
    projects.insert_one(project_dict)
    return (True, project_dict)


def remove_project(projID):
    '''Removes the specified project
    Args: projID (int)
    Returns: True if project found & deleted, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    delete_result = projects.delete_one({'projID': projID})
    client.close()
    if delete_result.deleted_count == 0:
        return False
    else:
        return True


def get_projects():
    '''Retrieves list of all projects in the database
    Returns: tuple containing success report and list of projects (bool, dict)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    proj_cursor = projects.find({})
    result = list(proj_cursor)
    client.close()
    return result


# ===== CONTRIBUTOR FUNCTIONS ===== #

def add_contributor(projID, username):
    client = MongoClient()
    projects = client["sculptio"].projects
    # Add username to contributors list only if it isn't already in the set
    update_result = projects.update_one({'projID': projID},
                                        {"$addToSet": {"contributors": username}})
    client.close()
    return update_result.matched_count > 0


# ===== PERMISSIONS FUNCTIONS ===== #

def update_access_rights(projID, publicity):
    '''Updates the project's access rights
    Args: projID (int), publicity (bool)
    Returns: True if project found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    update_result = projects.update_one({'projID': projID},
                                        {"$set": {"accessRights": publicity}})
    client.close()
    return update_result.matched_count > 0


def update_visibility(projID, visibility):
    '''Updates the project's visibility
    Args: projID (int), visibility (bool)
    Returns: True if project found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    update_result = projects.update_one({'projID': projID},
                                        {"$set": {"visibile": visibility}})
    client.close()
    return update_result.matched_count > 0


def update_permitted_user(projID, username, level):
    '''Updates permissions for given user in project
    Args: projID (int), username (str), level (str)
    Returns: True if project found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    user_q = "permittedUsers." + username
    update_result = projects.update_one({'projID': projID},
                                        {"$set": {user_q: level}})
    client.close()
    return update_result.matched_count > 0


def remove_permitted_user(projID, username):
    '''Removes permissions for given user from project
    Args: projID (int), username (str), level (str)
    Returns: True if project found & updated, False otherwise (bool)
    '''
    client = MongoClient()
    projects = client["sculptio"].projects
    user_q = "permittedUsers." + username
    update_result = projects.update_one({'projID': projID},
                                        {"$unset": {user_q: ""}})
    client.close()
    return update_result.matched_count > 0


# ===== PROJECT METADATA FUNCTIONS ===== #

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
    return update_result.matched_count > 0


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
    return update_result.matched_count > 0


# ===== SCULPTURE FUNCTIONS ===== #

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
    if update_result.matched_count == 0:
        client.close()
        return (False, {})
    else:
        updated_dict = projects.find({"projID": projID})[0]
        client.close()
        return (True, updated_dict)


# ===== CURRENTLY UNIMPLEMENTED FUNCTIONS ===== #

# def update_project(projID, name=None, owner=None, contributors=None,
#                    description=None, sculpture=None):
#     pass
#
#
# # ===== PROJID FUNCTIONS ===== #
#
# def get_last_projID():
#     pass
#
#
# def inc_last_projID():
