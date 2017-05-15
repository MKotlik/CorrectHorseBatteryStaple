# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# app.py - main server module

# TODO: use flask-socketio for socketio backend

from flask import Flask, render_template, request, session, url_for, redirect
from utils import database

app = Flask(__name__)
app.secret_key = "horses"


# ===== ROUTES ===== #

@app.route("/")
def root():
    # Redirects to home
    return redirect(url_for('home'))


@app.route("/home/")
def home():
    # Displays the homepage, diff versions based on login status
    pass


@app.route("/login/", methods=["GET", "POST"])
def login():
    # Displays login form and processes login input
    pass


@app.route("/register/", methods=["GET", "POST"])
def register():
    # Displays register form and processes registration input
    pass


@app.route("/logout/", methods=["POST"])
def register():
    # If logged in, logs user out, redirects to home
    if is_logged_in():
        logout()
    redirect(url_for('home'))


@app.route("/project/<projID>")
def project(projID):
    # Displays editor for project specified by projID
    # projID is generated when a new project is created
    pass


@app.route("/profile/")
def profile():
    # Displays the profile of the currently logged in user
    # NOTE: Shows a "please log in" page or redirects to login if not logged in
    pass


@app.route("/search/<query>")
def search(query):
    # Displays search results for given query
    # NOTE: should we have a search page w/o query as well? (/search/)
    pass

# ===== LOGIN HELPERS ===== #


def is_logged_in():
    return "username" in session


def get_username():
    return session["username"]


def logout():
    session.pop('username')


# -- run module -- #

if __name__ == "__main__":
    app.debug = True
    app.run()
