FROM node:10.15.3-alpine as node-builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/

RUN set -ex \
    && yarn install --prod \
    && yarn cache clean

COPY client/ /usr/src/app/client
COPY webpack.config.ts babel.config.js tsconfig.json tsconfig.prod.json .eslintrc.yml /usr/src/app/

RUN yarn build

# ACTUAL BUILD
FROM python:3.7.3-slim

ENV PYTHONUNBUFFERED 1
ENV DJANGO_STATIC_ROOT /srv/static
ENV DJANGO_MEDIA_ROOT /dev/media
ENV BUILD_PACKAGES build-essential libpq-dev

RUN addgroup --system --gid 1000 django \
    && adduser --system -uid 1000 --ingroup django django
RUN mkdir -p /srv/static /srv/media /var/log/pj

RUN apt-get update

RUN apt-get install -y libpq5

COPY requirements.txt /usr/src/app/

RUN set -ex \
    && apt-get install -y $BUILD_PACKAGES \
    && pip install --no-cache-dir -r /usr/src/app/requirements.txt \
    && apt-get autoremove -y $BUILD_PACKAGES

COPY --chown=django:django manage.py package.json /usr/src/app/
COPY --chown=django:django server/ /usr/src/app/server
COPY --chown=django:django conf/ /usr/src/app/conf
COPY --chown=django:django --from=node-builder /usr/src/app/build/web /usr/src/app/build/web

WORKDIR /usr/src/app
RUN python manage.py collectstatic --noinput
RUN chown -R django:django /var/log/pj

USER django

VOLUME ["/srv/"]

EXPOSE 8000
CMD ["gunicorn", "--config", "/usr/src/app/conf/gunicorn.conf.py", "server.wsgi"]
