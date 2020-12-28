# HTTPS by nginex on Docker


## Let's Encrypt

> The main limit is Certificates per Registered Domain (50 per week). 

主な上限は週50回まで。サブドメインは別だよね。

> Renewals are treated specially: they don’t count against your Certificates per Registered Domain limit, but they are subject to a Duplicate Certificate limit of 5 per week.

更新の扱いを受けたのかも。週5回までらしい。

```bash
docker run -it --rm --name certbot \
            -p "80:80" -p "443:443" \
            -v "/etc/letsencrypt:/etc/letsencrypt" \
            -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
            certbot/certbot certonly
```

Q1.

```
1: Spin up a temporary webserver (standalone)
2: Place files in webroot directory (webroot)
```

-> `1` を選択。 80 と443 ポートが空いていることが必要。

Q2.

```
Please enter in your domain name(s) (comma and/or space separated)  (Enter 'c'
to cancel):
```

`my-remote-access.ddo.jp`

### Log (2020-12-28)

```
[opc@instance-20200818-1222 ssl]$ docker run -it --rm --name certbot \
>             -p "80:80" -p "443:443" \
>             -v "/etc/letsencrypt:/etc/letsencrypt" \
>             -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
>             certbot/certbot certonly
Saving debug log to /var/log/letsencrypt/letsencrypt.log

How would you like to authenticate with the ACME CA?
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
1: Spin up a temporary webserver (standalone)
2: Place files in webroot directory (webroot)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Select the appropriate number [1-2] then [enter] (press 'c' to cancel): 1
Plugins selected: Authenticator standalone, Installer None
Please enter in your domain name(s) (comma and/or space separated)  (Enter 'c'
to cancel): my-remote-access.ddo.jp
Requesting a certificate for my-remote-access.ddo.jp
Performing the following challenges:
http-01 challenge for my-remote-access.ddo.jp
Waiting for verification...
Cleaning up challenges

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/my-remote-access.ddo.jp/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/my-remote-access.ddo.jp/privkey.pem
   Your cert will expire on 2021-03-28. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
```

### 認証関連ファイル

```
[opc@instance-20200818-1222 ssl]$ sudo cat -n /etc/letsencrypt/live/README
     1  This directory contains your keys and certificates.
     2
     3  `[cert name]/privkey.pem`  : the private key for your certificate.
     4  `[cert name]/fullchain.pem`: the certificate file used in most server software.
     5  `[cert name]/chain.pem`    : used for OCSP stapling in Nginx >=1.3.7.
     6  `[cert name]/cert.pem`     : will break many server configurations, and should not be used
     7                   without reading further documentation (see link below).
     8
     9  WARNING: DO NOT MOVE OR RENAME THESE FILES!
    10           Certbot expects these files to remain in this location in order
    11           to function properly!
    12
    13  We recommend not moving these files. For more information, see the Certbot
    14  User Guide at https://certbot.eff.org/docs/using.html#where-are-my-certificates.
```

```
[opc@instance-20200818-1222 ssl]$ sudo ls -lh /etc/letsencrypt/live/my-remote-access.ddo.jp
total 4.0K
lrwxrwxrwx. 1 root root  47 Dec 28 01:06 cert.pem -> ../../archive/my-remote-access.ddo.jp/cert1.pem
lrwxrwxrwx. 1 root root  48 Dec 28 01:06 chain.pem -> ../../archive/my-remote-access.ddo.jp/chain1.pem
lrwxrwxrwx. 1 root root  52 Dec 28 01:06 fullchain.pem -> ../../archive/my-remote-access.ddo.jp/fullchain1.pem
lrwxrwxrwx. 1 root root  50 Dec 28 01:06 privkey.pem -> ../../archive/my-remote-access.ddo.jp/privkey1.pem
-rw-r--r--. 1 root root 692 Dec 28 01:06 README
```

```
[opc@instance-20200818-1222 ssl]$ sudo cat -n /etc/letsencrypt/live/my-remote-access.ddo.jp/README
     1  This directory contains your keys and certificates.
     2
     3  `privkey.pem`  : the private key for your certificate.
     4  `fullchain.pem`: the certificate file used in most server software.
     5  `chain.pem`    : used for OCSP stapling in Nginx >=1.3.7.
     6  `cert.pem`     : will break many server configurations, and should not be used
     7                   without reading further documentation (see link below).
     8
     9  WARNING: DO NOT MOVE OR RENAME THESE FILES!
    10           Certbot expects these files to remain in this location in order
    11           to function properly!
    12
    13  We recommend not moving these files. For more information, see the Certbot
    14  User Guide at https://certbot.eff.org/docs/using.html#where-are-my-certificates.
```



#### certificate (expire 2021-03-28)

```
/etc/letsencrypt/live/my-remote-access.ddo.jp/fullchain.pem
```

#### key file

```
/etc/letsencrypt/live/my-remote-access.ddo.jp/privkey.pem
```

## オレオレ認証をしてみる。

ref : https://rinoguchi.hatenablog.com/entry/2019/05/31/135145

nginxのSSLの設定は以下

```
server {
    listen                 80;
    server_name            my-remote-access.ddo.jp;
    return                 301                         https://$host$request_uri;
}

# Docker & Node.js & Socket.io & NGINXでよくあるエラー
# https://qiita.com/risto24/items/d8c2fcbade582a15ca29

server {
    listen                 443                         ssl;
    server_name            my-remote-access.ddo.jp;
    ssl_certificate        /etc/nginx/ssl/server.crt; # SSL certification
    ssl_certificate_key    /etc/nginx/ssl/server.key; # private key
    location / {
        proxy_pass          http://video-chat:3000;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location /socket.io/ {
        proxy_pass          http://video-chat:3000;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### ssl directory

```bash
$ mkdir ssl
$ cd ssl
```

### server.key

```bash
$ openssl genrsa 2048 > server.key
```

### server.csr

```bash
$ openssl req -new -key server.key > server.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:81
State or Province Name (full name) [Some-State]:tokyo
Locality Name (eg, city) []:tokyo
Organization Name (eg, company) [Internet Widgits Pty Ltd]:none
Organizational Unit Name (eg, section) []:none
Common Name (e.g. server FQDN or YOUR name) []:my-remote-access.ddo.jp        
Email Address []:dnainainai@gmail.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:****
An optional company name []:
```

Common Name はサブドメインを含むドメイン名を指定する。

### server.crt

```
openssl x509 -days 36500 -req -signkey server.key < server.csr > server.crt
```

### Test

`C:\Windows\System32\drivers\etc` > `hosts` ファイルにドメインを登録