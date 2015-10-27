FROM golang:latest
ADD . /opt/walkhub
ENV HOST 0.0.0.0
ENV PORT 443
WORKDIR /opt/walkhub
ENTRYPOINT /opt/walkhub/walkhub
EXPOSE 80
EXPOSE 443
