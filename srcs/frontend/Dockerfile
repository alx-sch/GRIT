# FAKE FRONTEND

# Use a minimal web server image
FROM httpd:2.4-alpine

# Change the default port from 80 to 3000
# This is the internal port Caddy will talk to.
RUN sed -i 's/Listen 80/Listen 3000/' /usr/local/apache2/conf/httpd.conf

# Copy your real website files into the server's web root
COPY ./htdocs/ /usr/local/apache2/htdocs/

# Expose the new port
EXPOSE 3000
