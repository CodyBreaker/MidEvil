FROM php:8.2-apache

# Install mysqli
RUN docker-php-ext-install mysqli

# Enable Apache mod_rewrite (optional)
RUN a2enmod rewrite

# Copy backend code
COPY . /var/www/html/
