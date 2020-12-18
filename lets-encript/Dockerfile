FROM debian:buster

# https://certbot.eff.org/lets-encrypt/debianbuster-nginx

# install spapd
# https://snapcraft.io/docs/installing-snap-on-debian
RUN apt-get update && apt-get install -y snapd \
  && apt-get autoremove \
  && rm -rf /var/lib/apt/lists/*

RUN systemctl status snapd.service

RUN snap install core; snap refresh core
RUN snap install --classic certbot

# up to date
RUN ln -s /snap/bin/certbot /usr/bin/certbot

# get certificate
RUN certbot certonly --nginx

# update
# RUN certbot renew --dry-run

CMD pwd && ls -l