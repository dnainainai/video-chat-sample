# HTTPS by nginex on Docker



## オレオレ認証をしてみる。

ref : https://rinoguchi.hatenablog.com/entry/2019/05/31/135145

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