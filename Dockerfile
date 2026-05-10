FROM php:8.4-fpm

RUN curl -sSLf \
        -o /usr/local/bin/install-php-extensions \
        https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions && \
    chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions intl gd zip mysqli pdo_mysql 

WORKDIR /var/www/html

COPY . .

RUN chown www-data:www-data -R /var/www/html
RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache