# log-collector: rsyslog on Alpine, configured by rsyslog.conf next to this file
FROM alpine:3.22
RUN apk add --no-cache rsyslog && mkdir -p /logs /var/lib/rsyslog
COPY rsyslog.conf /etc/rsyslog.conf
EXPOSE 514/udp 514/tcp
CMD ["rsyslogd", "-n", "-f", "/etc/rsyslog.conf"]
