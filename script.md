```bash
export KUBECONFIG=....
```

```bash
kubectl create ns serverless-demo
```

```bash
 kyma init function --name s3-uploader  --runtime nodejs14 --namespace serverless-demo
```
Edit handler.js file

```
"use strict";
const AWS = require("aws-sdk");
module.exports = {
  main: async function (event, context) {

      if(event.extensions.request.headers['ce-type']){
          console.log(`Cloud event arrived from ${event.extensions.request.headers['origin']}`);
          console.log(`event source : ${event.extensions.request.headers['ce-source']}`);
          console.log(`event type : ${event.extensions.request.headers['ce-type']}`);
      }
      
      let s3 = new AWS.S3({
        endpoint: readEnv("S3_ENDPOINT"),
        accessKeyId: readEnv("S3_ACCESSKEY_ID"),
        secretAccessKey: readEnv("S3_SECRET"),
      });

      let body = JSON.stringify(event.data);

      let params = {
        Bucket: readEnv("S3_BUCKET"),
        Key: Date.now().toString(),
        Body: body,
      };
    try {
      console.log(`Pushing ${body} to S3`)  
      return await s3.upload(params).promise();
    } catch (e) {
      console.log(e);
      return e;
    }
  },
};

function readEnv(env = "") {
    if(process.env[env]){
        console.log(`Reading ENV [${env}]`)  
        return process.env[env];      
    } else {
        throw new Error (`Missing required env [${env}]`);
    }
}
```

Edit package.json
```
    "aws-sdk": "^2.553.0"
```

Edit config.yaml to add ems subscriptions

```
subscriptions:
  - name: ems-test
    filter:
      filters:
        - eventSource:
            property: source
            type: exact
            value: ""
          eventType:
            property: type
            type: exact
            value: sap.kyma.custom.demo.data.arrived.v1
```

Edit config.yaml to add S3 credentials & config

```
env:
  - name: S3_BUCKET
    valueFrom:
      configMapKeyRef:
        name: s3-config
        key: s3-bucket
  - name: S3_ENDPOINT
    valueFrom:
      configMapKeyRef:
        name: s3-config
        key: s3-endpoint
  - name: S3_ACCESSKEY_ID
    valueFrom:
      secretKeyRef:
        name: s3-secret
        key: s3-accesskey-id
  - name: S3_SECRET
    valueFrom:
      secretKeyRef:
        name: s3-secret
        key: s3-secret
```

Apply S3 config and secret in the kyma runtime

```bash

export S3_ACCESSKEY_ID= .... // {ACCESS_KEY_ID} | base64
export S3_SECRET= .... // {S3_SECRET} | base64

export S3_ENDPOINT=https://storage.googleapis.com
export S3_BUCKET=... //{S3 bucket name}
```

```
cat <<EOF | kubectl apply -f -
  apiVersion: v1
  kind: Secret
  metadata:
    name: s3-secret
    namespace: $NAMESPACE
  type: Opaque
  data:
    s3-accesskey-id: $S3_ACCESSKEY_ID
    s3-secret: $S3_SECRET
EOF
```

```
cat <<EOF | kubectl apply -f -
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: s3-config
    namespace: $NAMESPACE
  data:
    s3-endpoint: $S3_ENDPOINT
    s3-bucket: $S3_BUCKET
EOF
```

```
kyma apply function
```

Inspect logs using LogQL

```
{function="s3-uploader"} |= "foo"
```

Inspect metrics using grafana

```
 Oh.. and BTW vendor is : "+process.env['vendor']
```

Custom Docker registry
```
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
type: kubernetes.io/dockerconfigjson
metadata:
 name: serverless-registry-config
 namespace: serverless-demo
 labels:
   serverless.kyma-project.io/remote-registry: config
data:
 username: $(echo -n "${DOCKER_USERNAME}" | base64)
 password: $(echo -n "${DOCKER_PASSWORD}" | base64)
 serverAddress: $(echo -n "${SERVER_ADDRESS}" | base64)
 registryAddress: $(echo -n "${REGISTRY_ADDRESS}" | base64)
EOF
```