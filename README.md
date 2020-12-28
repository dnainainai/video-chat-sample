# ビデオチャットアプリのサンプル

参考 : https://neos21.hatenablog.com/entry/2020/07/18/080000

## 注意

- HTTPS でないと使えない。
  - localhost では使えるが、公開して使うためには HTTPS とするのは必須。

## 仕組み

WebRTCでP2Pの双方向通信をすることで、カメラと音声を双方向にやりとりする。

1. シグナリングサーバに接続する
   - Socket.ioを使用
   - 双方向通信のために、お互いの接続するための情報を交換する
   - シグナリングを実現するために、WebSocket (Client/Server) を利用する。
     - WebSocketなので、2台のPC（Client）からServerにアクセスする。
     - アクセスした2台のPC間で、WebRTCの接続に必要な情報を交換する。
   - Session Description Protocol (SDP) で、必要な情報は？
1. ウェブカメラを起動
   - `navigator.mediaDevices.getUserMedia()`を使用
1. WebRTCで双方向通信の準備
   - [RTCPeerConnection](https://developer.mozilla.org/ja/docs/Web/API/RTCPeerConnection)インスタンスを生成し、カメラのストリームを`addTrack()`で追加する。
1. Offer SDPを作る
   - `createOffer()`
1. Offer SDPを自分のピア(`RTCPeerConnection`)に登録
   - `setLocalDescription()`
1. Offer SDPをシグナリングサーバーに送信する
   - Socket.ioを使用
1. シグナリングサーバーで、受け取ったOffer SDPを、接続されているクライアントに送る
   - この時点で1代しか接続されていない場合は、待ち続ける？
1. 途中までで力尽きた！




### WebRTC

- ブラウザでPeer-to-Peer (P2P) の通信を行う。
- 動画と音声なので、UDP/IPを選択する。

#### Session Description Protocol (SDP)

RTCPeerConnectionのUDT/IPの接続に必要な情報。

- メディア
  - 種類（音声、映像）
  - 形式（コーデック）
- IPアドレス
- ポート番号
- P2Pのデータ転送プロトコル
  - WebRTCはSecure RTP
- 通信で使用する帯域
- セッションの属性
  - 名前
  - 識別子
  - アクティブな時間、など

#### Interactive Connectivity Establishment (ICE)

ホスト間で接続を確立するためにSTUNとTURNを調整する方法について記述した包括的な標準である。

可能性のある通信経路に関する情報を示し、文字列で表現する。次のような複数の系をロ候補としてリストアップする。

- P2Pによる直接通信
- STUNによる、NAT通過のためのポートマッピング → 最終的にP2Pになる
- TURNによる、リレーサーバーを介した中継通信


##### STUN : Session Traversal Utilities for NAT

ホストがNAT/ファイアウォールの背後にあるときにSTUNを使用してパブリックIPアドレスを検出する。

##### TURN : Traversal Using Relay around NAT

STUNで2つのホストの直接接続を許可しない場合、TURNを実装して、サーバーへの接続を確立する。

## Usage

```
docker-compose up
```

Access : http://localhost:3001

### Test vide chat only

SSLを使用せずにLocalでテストする。LANでも、localhost以外ではSSLを使用しないとVideoにアクセスできないことに注意。

```
docker-compose -f docker-compose-local.yml up
```

Access : http://localhost:3001