FROM node:14

RUN apt update && apt -y upgrade

WORKDIR /server
