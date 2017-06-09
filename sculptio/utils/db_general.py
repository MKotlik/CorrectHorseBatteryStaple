# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# database.py - general mongoDB interactions

from pymongo import MongoClient


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

    # Insert a starting id of 0 into lastprojid if ID entry doesnt yet exist
    if lastprojid.find({}).count() == 0:
        lastprojid.insert_one({"ID": 0})

    client.close()
    # PyMongo should throw error on failure, but return success status as well
    return resultU == 'username_1' and resultP == 'projID_1'
