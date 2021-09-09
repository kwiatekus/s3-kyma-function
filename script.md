```bash
export KUBECONFIG=....
```

```bash
kubectl create ns serverless-demo
export NAMESPACE=serverless-demo
```

```bash
 kyma init function --name s3-uploader  --runtime nodejs14 --namespace serverless-demo
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
