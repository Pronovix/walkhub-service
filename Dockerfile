FROM golang:latest
ADD . /opt/walkhub
WORKDIR /opt/walkhub
ENTRYPOINT /opt/walkhub/walkhub
EXPOSE 80
EXPOSE 443
