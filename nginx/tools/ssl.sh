# !/bin/bash
# Generate a private key
openssl genpkey -algorithm RSA -out /etc/ssl/private/nginx-selfsigned.key

# Generate a self-signed certificate
openssl req -x509 -new -nodes -key /etc/ssl/private/nginx-selfsigned.key -sha256 -days 365 -out /etc/ssl/certs/nginx-selfsigned.crt  -subj "/C=MR/ST=khouribgha/L=khouribgha/O=1337/OU=OrganizationalUnit/CN=localhost/emailAddress=issam@gmail.com"
