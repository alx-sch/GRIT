# FAKE BACKEND

# Use a minimal web server image (Alpine is very small)
FROM httpd:2.4-alpine

# Change the default port from 80 to 8000
# This is the internal port Caddy will talk to.
RUN sed -i 's/Listen 80/Listen 8000/' /usr/local/apache2/conf/httpd.conf

# Copy our fake API page into the server's web root
COPY ./htdocs/ /usr/local/apache2/htdocs/

# Expose the new port
EXPOSE 8000
