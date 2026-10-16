# Bruin Maps
An open-source software mapping the George Fox University Campus, including planning &amp; navigation features

This software will utilize the following software:
* [GitHub Pages](https://docs.github.com/en/pages)
* [Cloudflare Workers](https://www.cloudflare.com/products/workers/)

## What are you building?
We are building a website that lets users easily find the best route(s) between two points on campus. It will be accessible so anyone struggling to find their way on campus can use it.

## Why are you building it?
We are building this to give students a way to find their way around campus quickly and with ease. The goal is that students use it to find buildings, find quick routes, and save time as they walk to classes.

## How is the repository organized? 
The README file will explain everything about the repository. We will use GitHub Pages to organize our work and minimize clutter.

## Meeting times and daily scrum meetings
We will try to meet daily in the Newlin lobby study room at around 5pm each day. 


## 1. Software Architecture
Components: 
The website, api, and database need to be hosted online.
A search bar letting users find and select locations, with recommendations. 
A map of the campus, giving the names of locations and where they are.
A menu allowing users to add and select the order of a route they’d like to create.
Zoom & drag features to navigate the map.
Interfaces: 
You should be able to build a list of places you’d like to visit and the order in which you’d like to visit them. You’d then send the list in that order to the api which would process & calculate the best route and send it back to the client. Similarly, on website load, the website should request a list of all valid locations, and the client will do the processing for searching that list.
The website needs to receive:
List of available locations to search from api/database.
Best path after requesting with the list of locations to visit.
Receive a list of all professor office locations & hours, provided a valid authentication token was provided to the server (stretch goal).
Stored Data
Tables with:
List of valid locations (id, name)
List of professor office hours (id, building id, office id) (stretch goal)
List of buildings to other buildings times (startpoint building id, list of endpoints each with building id and time/distance)
## 2. Software Design
Module Decomposition Diagram for the system: https://drive.google.com/file/d/16HyW4uy6QwhH16MoAh6iGv81PW7lAzR-/view?usp=sharing 
A detailed and complete ER model: https://drive.google.com/file/d/1ETXe6aMgQavHUbSKfs20tvf6qdLKRKTI/view?usp=drive_link

## 3. Coding Guidelines
JavaScript: JavaScript Style Guide
HTML & CSS: HTML/CSS Style Guide
SQL: SQL style guide
