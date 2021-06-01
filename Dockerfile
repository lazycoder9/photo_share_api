FROM node:14-buster-slim

RUN apt update && apt -y upgrade

WORKDIR /server
