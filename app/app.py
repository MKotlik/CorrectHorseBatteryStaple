# sculpt.io - Team CorrectHorseBatteryStaple
# SoftDev, Spring 2017
# app.py - main server module

from flask import Flask, render_template, request, session, url_for, redirect
from utils import database

app = Flask(__name__)
app.secret_key = "horses"


# -- ROUTES -- #

@app.route("/")
def root():
    pass


@app.route("/home/")
def home():
    pass


@app.route("/login/", methods=["GET", "POST"])
def login():
    pass


@app.route("/register/", methods=["GET", "POST"])
def register():
    pass


@app.route("/search/<query>")
def search(query):
    pass


@app.route("/project/<projID>")
def project(projID):
    pass


@app.route("/profile/")
def profile():
    pass
